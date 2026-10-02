import getLogger from 'debug';

import { DAVCredentials } from '../types/models';
import { fetch } from './fetch';
import { md5 } from './md5';

const debug = getLogger('tsdav:digestAuth');

/**
 * HTTP Digest authentication (RFC 7616) as a `fetch` wrapper.
 *
 * A Digest `Authorization` header depends on the request method, the request
 * URI and a per-nonce counter, so it cannot be computed once at login like a
 * Basic header. Wrapping `fetch` puts the handshake under every request tsdav
 * makes (DAV requests, object PUT/DELETE and service discovery) without
 * touching each call site.
 */

type AuthChallenge = { scheme: string; params: Record<string, string> };

type DigestAlgorithm = 'MD5' | 'MD5-SESS' | 'SHA-256' | 'SHA-256-SESS';

export type DigestChallenge = {
  realm: string;
  nonce: string;
  opaque?: string;
  /** `auth` when the server offers it, undefined for RFC 2069 servers without qop */
  qop?: 'auth';
  algorithm: DigestAlgorithm;
  stale: boolean;
};

/** Shared Digest state of one client: the last challenge (with its nonce counter) per origin. */
export type DigestAuthState = {
  challenges: Map<string, { challenge: DigestChallenge; nc: number }>;
};

const TOKEN = /[!#$%&'*+.^_`|~0-9A-Za-z-]+/y;

/**
 * Parse a `WWW-Authenticate` header value into its challenges. `fetch` joins
 * repeated headers with ", ", so one value can hold several challenges.
 */
export const parseAuthenticateHeader = (value: string): AuthChallenge[] => {
  const challenges: AuthChallenge[] = [];
  let current: AuthChallenge | undefined;
  let pos = 0;
  const skip = (chars: RegExp) => {
    while (pos < value.length && chars.test(value[pos])) pos += 1;
  };

  while (pos < value.length) {
    skip(/[\s,]/);
    TOKEN.lastIndex = pos;
    const token = TOKEN.exec(value)?.[0];
    if (!token) {
      pos += 1;
      continue;
    }
    pos += token.length;
    skip(/\s/);
    if (value[pos] !== '=') {
      current = { scheme: token.toLowerCase(), params: {} };
      challenges.push(current);
      continue;
    }
    pos += 1;
    skip(/\s/);
    let paramValue = '';
    if (value[pos] === '"') {
      pos += 1;
      while (pos < value.length && value[pos] !== '"') {
        if (value[pos] === '\\') pos += 1;
        paramValue += value[pos] ?? '';
        pos += 1;
      }
      pos += 1;
    } else {
      while (pos < value.length && !/[\s,]/.test(value[pos])) {
        paramValue += value[pos];
        pos += 1;
      }
    }
    if (current) {
      current.params[token.toLowerCase()] = paramValue;
    }
  }
  return challenges;
};

const SUPPORTED_ALGORITHMS: DigestAlgorithm[] = ['SHA-256', 'SHA-256-SESS', 'MD5', 'MD5-SESS'];

const toDigestChallenge = (params: Record<string, string>): DigestChallenge | undefined => {
  const algorithm = (params.algorithm ?? 'MD5').toUpperCase() as DigestAlgorithm;
  if (!params.realm || !params.nonce || !SUPPORTED_ALGORITHMS.includes(algorithm)) {
    return undefined;
  }
  const qopOptions = params.qop?.split(',').map((qop) => qop.trim().toLowerCase());
  // Only qop=auth is supported; auth-int would require hashing every body.
  if (qopOptions && !qopOptions.includes('auth')) {
    return undefined;
  }
  // A -sess key is derived from the cnonce, which is only sent together with qop.
  if (!qopOptions && algorithm.endsWith('-SESS')) {
    return undefined;
  }
  return {
    realm: params.realm,
    nonce: params.nonce,
    opaque: params.opaque,
    qop: qopOptions ? 'auth' : undefined,
    algorithm,
    stale: params.stale?.toLowerCase() === 'true',
  };
};

/**
 * Pick the strongest supported Digest challenge from a `WWW-Authenticate`
 * value. Returns undefined when there is none.
 */
export const selectDigestChallenge = (
  header: string | null | undefined,
): DigestChallenge | undefined =>
  parseAuthenticateHeader(header ?? '')
    .filter(({ scheme }) => scheme === 'digest')
    .map(({ params }) => toDigestChallenge(params))
    .filter((challenge): challenge is DigestChallenge => challenge != null)
    .sort(
      (a, b) =>
        SUPPORTED_ALGORITHMS.indexOf(a.algorithm) - SUPPORTED_ALGORITHMS.indexOf(b.algorithm),
    )[0];

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Thrown when a server has to be answered with Digest but the runtime has no WebCrypto. */
export class DigestUnsupportedError extends Error {
  constructor() {
    super(
      'tsdav: Digest authentication requires the WebCrypto API (globalThis.crypto), ' +
        'available in Node.js >= 19, browsers, Bun and Deno.',
    );
    this.name = 'DigestUnsupportedError';
  }
}

// MD5 is built in, so only SHA-256 needs `crypto.subtle`, which browsers
// hide on insecure origins. The cnonce needs `getRandomValues` either way.
const getCrypto = (algorithm?: DigestAlgorithm): Crypto => {
  const { crypto } = globalThis;
  if (!crypto?.getRandomValues || (algorithm?.startsWith('SHA') && !crypto.subtle)) {
    throw new DigestUnsupportedError();
  }
  return crypto;
};

const hash = async (algorithm: DigestAlgorithm, data: string): Promise<string> =>
  algorithm.startsWith('MD5')
    ? md5(data)
    : toHex(
        new Uint8Array(
          await getCrypto(algorithm).subtle.digest('SHA-256', new TextEncoder().encode(data)),
        ),
      );

const quote = (value: string): string => `"${value.replace(/["\\]/g, '\\$&')}"`;

// RFC 7616 §3.4.4: a username that is not printable ASCII is sent as an
// RFC 5987 extended value, which percent-encodes everything but attr-char.
const usernameField = (username: string): string =>
  /^[\x20-\x7e]*$/.test(username)
    ? `username=${quote(username)}`
    : `username*=UTF-8''${encodeURIComponent(username).replace(
        /['()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
      )}`;

/**
 * Compute the `Authorization` header value for one request (RFC 7616 §3.4;
 * RFC 2069 form when the challenge carries no qop).
 */
export const buildDigestAuthorization = async (params: {
  challenge: DigestChallenge;
  username: string;
  password: string;
  method: string;
  uri: string;
  nc: number;
  cnonce: string;
}): Promise<string> => {
  const { challenge, username, password, method, uri, cnonce } = params;
  const { realm, nonce, qop, algorithm } = challenge;
  const nc = params.nc.toString(16).padStart(8, '0');

  let ha1 = await hash(algorithm, `${username}:${realm}:${password}`);
  if (algorithm.endsWith('-SESS')) {
    ha1 = await hash(algorithm, `${ha1}:${nonce}:${cnonce}`);
  }
  const ha2 = await hash(algorithm, `${method}:${uri}`);
  const response = await hash(
    algorithm,
    qop ? `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}` : `${ha1}:${nonce}:${ha2}`,
  );

  const fields = [
    usernameField(username),
    `realm=${quote(realm)}`,
    `uri=${quote(uri)}`,
    `algorithm=${algorithm.replace('-SESS', '-sess')}`,
    `nonce=${quote(nonce)}`,
    ...(qop ? [`nc=${nc}`, `cnonce=${quote(cnonce)}`, `qop=${qop}`] : []),
    `response=${quote(response)}`,
    ...(challenge.opaque != null ? [`opaque=${quote(challenge.opaque)}`] : []),
  ];
  return `Digest ${fields.join(', ')}`;
};

const createCnonce = (): string => toHex(getCrypto().getRandomValues(new Uint8Array(16)));

const toURL = (input: RequestInfo | URL): URL | undefined => {
  if (input instanceof URL) return input;
  if (typeof input !== 'string') return undefined;
  try {
    return new URL(input);
  } catch {
    return undefined;
  }
};

// Streams can only be sent once, so such a request cannot be answered with a retry.
const isReplayable = (body: RequestInit['body']): boolean =>
  body == null ||
  typeof body !== 'object' ||
  !(
    typeof (body as ReadableStream).getReader === 'function' ||
    Symbol.asyncIterator in (body as object)
  );

// Same limit as fetch itself (WHATWG Fetch, "HTTP-redirect fetch").
const MAX_REDIRECTS = 20;
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];
const BODY_HEADERS = ['content-encoding', 'content-language', 'content-location', 'content-type'];

/**
 * The request fetch makes for the next hop of a redirect: a 303 (and a 301 or
 * 302 after POST) turns into a GET without body and body headers, every other
 * redirect keeps method and body.
 */
const redirectInit = (status: number, init: RequestInit): RequestInit => {
  const method = (init.method ?? 'GET').toUpperCase();
  if (
    (status === 303 && method !== 'GET' && method !== 'HEAD') ||
    ((status === 301 || status === 302) && method === 'POST')
  ) {
    const headers = new Headers(init.headers);
    for (const name of BODY_HEADERS) headers.delete(name);
    return { ...init, method: 'GET', body: undefined, headers };
  }
  return init;
};

const withoutAuthorization = (init: RequestInit): RequestInit => {
  const headers = new Headers(init.headers);
  headers.delete('authorization');
  return { ...init, headers };
};

export const createDigestAuthState = (): DigestAuthState => ({ challenges: new Map() });

/**
 * Wrap `fetch` with Digest authentication.
 *
 * - Once a challenge is known for an origin, requests carry a fresh
 *   `Authorization` header up front (incrementing `nc`).
 * - A 401 with a Digest challenge is answered by exactly one retry; this also
 *   covers an expired (`stale=true`) nonce. A 401 on that retry is returned to
 *   the caller as a credentials error.
 * - Redirects are followed by the wrapper, because the `Authorization` header
 *   is bound to the request URI. Credentials are only sent to the origin of
 *   the original request. A caller's `redirect: 'manual'` or `'error'` is
 *   passed through to `fetch` unchanged.
 *
 * Requests that start in parallel before a challenge is known each get their
 * own 401 first; a client's login caches the challenge before that happens.
 */
export const createDigestFetch = (params: {
  credentials: Pick<DAVCredentials, 'username' | 'password'>;
  fetch?: typeof fetch;
  state?: DigestAuthState;
}): typeof fetch => {
  const { credentials, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride ?? fetch;
  const state = params.state ?? createDigestAuthState();

  const authorize = async (
    init: RequestInit,
    origin: string,
    method: string,
    uri: string,
  ): Promise<RequestInit> => {
    const entry = state.challenges.get(origin);
    if (!entry) return init;
    // Take the counter before any await, so parallel requests never share one.
    entry.nc += 1;
    const { challenge, nc } = entry;
    const authorization = await buildDigestAuthorization({
      challenge,
      username: credentials.username ?? '',
      password: credentials.password ?? '',
      method,
      uri,
      nc,
      cnonce: createCnonce(),
    });
    const headers = new Headers(init.headers);
    headers.set('authorization', authorization);
    return { ...init, headers };
  };

  // Store the Digest challenge of a 401 from `origin`; false if there is none to answer.
  const acceptChallenge = (response: Response, origin: string): boolean => {
    const challenge = selectDigestChallenge(response.headers.get('www-authenticate'));
    if (!challenge) {
      return false;
    }
    debug(`Digest challenge received for ${origin}${challenge.stale ? ' (stale nonce)' : ''}`);
    // Parallel requests can be challenged with the same nonce; its counter
    // carries on, since a repeated nc is rejected as a replay.
    const known = state.challenges.get(origin);
    state.challenges.set(origin, {
      challenge,
      nc: known?.challenge.nonce === challenge.nonce ? known.nc : 0,
    });
    return true;
  };

  // One request to `url`, plus the retry that answers a Digest challenge.
  const request = async (
    input: RequestInfo | URL,
    init: RequestInit,
    url: URL,
  ): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase();
    const uri = `${url.pathname}${url.search}`;

    const response = await requestFetch(input, await authorize(init, url.origin, method, uri));
    if (
      response.status !== 401 ||
      !isReplayable(init.body) ||
      !acceptChallenge(response, url.origin)
    ) {
      return response;
    }
    await response.body?.cancel().catch(() => undefined);
    return requestFetch(input, await authorize(init, url.origin, method, uri));
  };

  return async (input, init = {}) => {
    const url = toURL(input);
    if (!url) return requestFetch(input, init);
    if ((init.redirect ?? 'follow') !== 'follow' || !isReplayable(init.body)) {
      return request(input, init, url);
    }

    let target: RequestInfo | URL = input;
    let targetUrl = url;
    let targetInit: RequestInit = { ...init, redirect: 'manual' };
    let leftOrigin = false;
    for (let redirects = 0; ; redirects += 1) {
      const response = leftOrigin
        ? await requestFetch(target, targetInit)
        : await request(target, targetInit, targetUrl);
      if (response.type === 'opaqueredirect') {
        // Browsers hide the redirect target from 'manual'; let fetch follow it.
        return request(input, init, url);
      }
      const location = response.headers.get('location');
      if (!REDIRECT_STATUSES.includes(response.status) || !location) {
        return response;
      }
      if (redirects === MAX_REDIRECTS) {
        throw new TypeError('tsdav: too many redirects');
      }
      await response.body?.cancel().catch(() => undefined);
      targetUrl = new URL(location, targetUrl);
      target = targetUrl.href;
      targetInit = redirectInit(response.status, targetInit);
      if (targetUrl.origin !== url.origin) {
        // Like fetch, never send the Authorization header to another origin,
        // and do not sign again if that origin redirects back.
        leftOrigin = true;
        targetInit = withoutAuthorization(targetInit);
      }
    }
  };
};

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
  domain?: string;
  /** `auth` when the server offers it, undefined for RFC 2069 servers without qop */
  qop?: 'auth';
  algorithm: DigestAlgorithm;
  stale: boolean;
};

/**
 * Shared Digest state of one client: whether Digest is in use and the last
 * challenge (with its nonce counter) per origin.
 */
export type DigestAuthState = {
  active: boolean;
  challenges: Map<string, DigestSession[]>;
};

type DigestSession = {
  challenge: DigestChallenge;
  scopes: string[];
  nc: number;
  cnonce: string;
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
  if (params.realm == null || !params.nonce || !SUPPORTED_ALGORITHMS.includes(algorithm)) {
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
    domain: params.domain,
    qop: qopOptions ? 'auth' : undefined,
    algorithm,
    stale: params.stale?.toLowerCase() === 'true',
  };
};

/**
 * Pick the strongest supported Digest challenge from a `WWW-Authenticate`
 * value. Returns undefined when there is none, or when `unlessBasic` is set
 * and the server also accepts Basic.
 */
export const selectDigestChallenge = (
  header: string | null | undefined,
  {
    unlessBasic = false,
    allowSHA256 = true,
  }: { unlessBasic?: boolean; allowSHA256?: boolean } = {},
): DigestChallenge | undefined => {
  const challenges = parseAuthenticateHeader(header ?? '');
  if (unlessBasic && challenges.some(({ scheme }) => scheme === 'basic')) {
    return undefined;
  }
  return challenges
    .filter(({ scheme }) => scheme === 'digest')
    .map(({ params }) => toDigestChallenge(params))
    .filter((challenge): challenge is DigestChallenge => challenge != null)
    .filter((challenge) => allowSHA256 || !challenge.algorithm.startsWith('SHA'))
    .sort(
      (a, b) =>
        SUPPORTED_ALGORITHMS.indexOf(a.algorithm) - SUPPORTED_ALGORITHMS.indexOf(b.algorithm),
    )[0];
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Thrown when a server has to be answered with Digest but the runtime has no
 * WebCrypto. It is a property of the runtime, not of the URL that was asked,
 * so callers that fall back to another URL on a failed request must rethrow it.
 */
export class DigestUnsupportedError extends Error {
  constructor() {
    super(
      'tsdav: Digest authentication requires the WebCrypto API (globalThis.crypto), ' +
        'available in Node.js >= 19, browsers, Bun and Deno. ' +
        'On Node.js 18, assign webcrypto from node:crypto to globalThis.crypto.',
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

const protectionScopes = (challenge: DigestChallenge, url: URL): string[] => {
  if (!challenge.domain?.trim()) return [`${url.origin}/`];
  return challenge.domain
    .trim()
    .split(/\s+/)
    .flatMap((scope) => {
      try {
        // Relative domain values must be path-absolute (RFC 7616 §3.3).
        if (!scope.startsWith('/') && !/^[a-z][a-z\d+.-]*:/i.test(scope)) return [];
        const target = new URL(scope, `${url.origin}/`);
        target.hash = '';
        return target.origin === url.origin ? [target.href] : [];
      } catch {
        return [];
      }
    });
};

export const createDigestAuthState = (active = true): DigestAuthState => ({
  active,
  challenges: new Map(),
});

/**
 * Wrap `fetch` with Digest authentication.
 *
 * - Once a challenge is known for an origin, requests carry a fresh
 *   `Authorization` header up front (incrementing `nc`).
 * - A 401 with a Digest challenge is answered by exactly one retry; this also
 *   covers an expired (`stale=true`) nonce. A 401 on that retry is returned to
 *   the caller as a credentials error.
 * - With an inactive `state` (Basic auth), the wrapper passes requests through
 *   and only switches to Digest when a 401 offers Digest and no Basic. It never
 *   falls back from Digest to Basic.
 * - While Digest is active, redirects are followed by the wrapper, because the
 *   `Authorization` header is bound to the request URI. Credentials are only
 *   sent to the origin of the original request. A caller's `redirect: 'manual'`
 *   or `'error'` is passed through to `fetch` unchanged.
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
    url: URL,
    method: string,
    uri: string,
  ): Promise<RequestInit> => {
    const entry = state.challenges
      .get(url.origin)
      ?.find((session) => session.scopes.some((scope) => url.href.startsWith(scope)));
    if (!entry) return withoutAuthorization(init);
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
      cnonce: challenge.algorithm.endsWith('-SESS') ? entry.cnonce : createCnonce(),
    });
    const headers = new Headers(init.headers);
    headers.set('authorization', authorization);
    return { ...init, headers };
  };

  // Store the Digest challenge of a 401 from `origin`; false if there is none to answer.
  const acceptChallenge = (response: Response, url: URL): boolean => {
    const header = response.headers.get('www-authenticate');
    const options = {
      unlessBasic: !state.active,
    };
    const challenge =
      (!globalThis.crypto?.subtle &&
        selectDigestChallenge(header, { ...options, allowSHA256: false })) ||
      selectDigestChallenge(header, options);
    if (!challenge) {
      return false;
    }
    // Fail on a missing WebCrypto before the client is switched to Digest.
    try {
      getCrypto(challenge.algorithm);
    } catch (err) {
      // Automatic negotiation must not change Basic's behavior on older runtimes.
      if (!state.active && err instanceof DigestUnsupportedError) return false;
      throw err;
    }
    if (!state.active) {
      debug('Server only offers Digest authentication, switching from Basic');
      state.active = true;
    }
    debug(`Digest challenge received for ${url.origin}${challenge.stale ? ' (stale nonce)' : ''}`);
    // Parallel requests can be challenged with the same nonce; its counter
    // carries on, since a repeated nc is rejected as a replay.
    const sessions = state.challenges.get(url.origin) ?? [];
    const scopes = protectionScopes(challenge, url);
    const known = sessions.find(
      (session) =>
        session.challenge.realm === challenge.realm &&
        session.challenge.algorithm === challenge.algorithm &&
        session.challenge.nonce === challenge.nonce,
    );
    state.challenges.set(url.origin, [
      {
        challenge,
        scopes,
        nc: known?.nc ?? 0,
        cnonce: known?.cnonce ?? createCnonce(),
      },
      ...sessions.filter((session) => session.challenge.realm !== challenge.realm),
    ]);
    return true;
  };

  // One request to `url`, plus the retry that answers a Digest challenge
  // unless the caller already answered one for this request.
  const request = async (
    input: RequestInfo | URL,
    init: RequestInit,
    url: URL,
    retry: boolean,
  ): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase();
    const uri = `${url.pathname}${url.search}`;

    const response = await requestFetch(input, await authorize(init, url, method, uri));
    if (
      response.status !== 401 ||
      !retry ||
      !isReplayable(init.body) ||
      !acceptChallenge(response, url)
    ) {
      return response;
    }
    await response.body?.cancel().catch(() => undefined);
    return requestFetch(input, await authorize(init, url, method, uri));
  };

  return async (input, init = {}) => {
    const url = toURL(input);
    if (!url) return requestFetch(input, init);
    // Digest is handled here, not by the browser's HTTP-auth dialog/cache.
    // Explicit cookie credentials remain under the caller's control.
    if (state.active) init = { ...init, credentials: init.credentials ?? 'omit' };
    // Set when the Basic request below was answered with the switch to Digest.
    let challenged = false;
    if (!state.active) {
      // Basic auth: one plain request, fetch follows redirects itself. Only a
      // 401 from the original origin can switch the client to Digest.
      const response = await requestFetch(input, init);
      if (
        response.status !== 401 ||
        !isReplayable(init.body) ||
        // A custom fetch may report no URL or a relative one; assume no redirect then.
        (toURL(response.url ?? '') ?? url).origin !== url.origin ||
        !acceptChallenge(response, toURL(response.url) ?? url)
      ) {
        return response;
      }
      await response.body?.cancel().catch(() => undefined);
      challenged = true;
      init = { ...init, credentials: init.credentials ?? 'omit' };
      // Native fetch may have followed a same-origin redirect before negotiation.
      const finalUrl = toURL(response.url) ?? url;
      if (finalUrl.href !== url.href) {
        const method = (init.method ?? 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
          throw new TypeError(
            'tsdav: Digest negotiation after an automatic redirect requires the final DAV URL. ' +
              'Set serverUrl and collection URLs to their canonical locations.',
          );
        }
        return request(finalUrl.href, { ...init, redirect: 'error' }, finalUrl, false);
      }
    }
    if ((init.redirect ?? 'follow') !== 'follow' || !isReplayable(init.body)) {
      return request(input, init, url, !challenged);
    }

    let target: RequestInfo | URL = input;
    let targetUrl = url;
    let targetInit: RequestInit = { ...init, redirect: 'manual' };
    let leftOrigin = false;
    for (let redirects = 0; ; redirects += 1) {
      const response = leftOrigin
        ? await requestFetch(target, targetInit)
        : await request(target, targetInit, targetUrl, !challenged);
      challenged = false;
      if (response.type === 'opaqueredirect') {
        // A browser hides both Location and the redirect status. Replaying a write
        // can duplicate it, and a 303 may have changed its method. Only GET/HEAD
        // can be resolved safely without forwarding a URI-bound authorization.
        const method = (targetInit.method ?? 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
          throw new TypeError(
            'tsdav: Digest authentication cannot safely follow an opaque browser redirect ' +
              'for this method. Use the final DAV URL, including its trailing slash.',
          );
        }
        const resolved = await requestFetch(target, {
          ...withoutAuthorization(targetInit),
          redirect: 'follow',
        });
        const finalUrl = toURL(resolved.url);
        if (!finalUrl || finalUrl.origin !== url.origin || leftOrigin || resolved.status !== 401) {
          return resolved;
        }
        if (!acceptChallenge(resolved, finalUrl)) return resolved;
        await resolved.body?.cancel().catch(() => undefined);
        return request(finalUrl.href, { ...targetInit, redirect: 'error' }, finalUrl, false);
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

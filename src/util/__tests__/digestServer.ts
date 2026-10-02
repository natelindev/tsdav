import { createHash } from 'node:crypto';
import { vi } from 'vitest';

const md5 = (value: string) => createHash('md5').update(value).digest('hex');

export const parseDigestParams = (header: string): Record<string, string> =>
  Object.fromEntries(
    [...header.matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]+))/g)].map(([, key, quoted, plain]) => [
      key,
      quoted ?? plain,
    ]),
  );

/**
 * In-memory stand-in for a Digest-protected DAV server (qop=auth, MD5), which
 * validates every Authorization header independently of the code under test:
 * nonce, uri, username, the response hash and that no nonce count is reused.
 */
export const createDigestServer = (options: {
  username: string;
  password: string;
  realm?: string;
  isPublic?: (path: string) => boolean;
  handle: (method: string, path: string, body: unknown) => Response;
}) => {
  const { username, password, realm = 'BaikalDAV' } = options;
  let nonceCount = 1;
  let nonce = 'nonce-1';
  const usedCounts = new Set<string>();

  const challenge = (stale = false) => {
    const digest = `Digest realm="${realm}",qop="auth",nonce="${nonce}",opaque="opaque-1"${
      stale ? ',stale=true' : ''
    }`;
    return new Response('', { status: 401, headers: { 'www-authenticate': digest } });
  };

  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    if (options.isPublic?.(url.pathname)) {
      return options.handle(method, url.pathname, init.body);
    }
    const authorization = new Headers(init.headers).get('authorization');
    if (!authorization?.startsWith('Digest ')) {
      return challenge();
    }
    const params = parseDigestParams(authorization);
    if (params.nonce !== nonce) {
      return challenge(true);
    }
    if (params.uri !== `${url.pathname}${url.search}`) {
      return new Response('', { status: 400 });
    }
    const ha1 = md5(`${username}:${realm}:${password}`);
    const ha2 = md5(`${method}:${params.uri}`);
    const expected = md5(`${ha1}:${nonce}:${params.nc}:${params.cnonce}:auth:${ha2}`);
    if (params.username !== username || params.response !== expected) {
      return challenge();
    }
    // A nonce count is accepted once per nonce; a repeat is a replay.
    if (usedCounts.has(`${nonce}:${params.nc}`)) {
      return challenge();
    }
    usedCounts.add(`${nonce}:${params.nc}`);
    return options.handle(method, url.pathname, init.body);
  });

  return {
    fetch,
    /** Expire the current nonce, as a server does after its nonce lifetime. */
    rotateNonce: () => {
      nonceCount += 1;
      nonce = `nonce-${nonceCount}`;
    },
    authorizationOf: (call: number) =>
      new Headers(fetch.mock.calls[call][1]?.headers).get('authorization'),
  };
};

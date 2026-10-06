import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import { createDigestAuthState, createDigestFetch } from '../digestAuth';
import { createDigestServer, parseDigestParams } from './digestServer';

const credentials = { username: 'user', password: 'password' };
const ok = () => new Response(null, { status: 207 });
const challenge = (params = 'realm="r", nonce="n", qop="auth"') =>
  new Response(null, { status: 401, headers: { 'www-authenticate': `Digest ${params}` } });
const opaqueRedirect = () => {
  const response = new Response(null);
  Object.defineProperties(response, {
    type: { value: 'opaqueredirect' },
    status: { value: 0 },
  });
  return response;
};

describe('Digest session and protection-space regressions', () => {
  it.each(['MD5-sess', 'SHA-256-sess'])(
    'retains the %s session key without extra 401s',
    async (algorithm) => {
      const hash = (value: string) =>
        createHash(algorithm.startsWith('MD5') ? 'md5' : 'sha256')
          .update(value)
          .digest('hex');
      let sessionKey: string | undefined;
      let unauthorized = 0;
      const server = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const auth = new Headers(init?.headers).get('authorization');
        if (auth) {
          const params = parseDigestParams(auth);
          // Session keys are derived from the initial challenge response, not each request.
          sessionKey ??= hash(`${hash('user:r:password')}:n:${params.cnonce}`);
          const expected = hash(
            `${sessionKey}:n:${params.nc}:${params.cnonce}:auth:${hash(`PROPFIND:${params.uri}`)}`,
          );
          if (params.response === expected) return ok();
        }
        unauthorized++;
        sessionKey = undefined;
        return challenge(`realm="r", nonce="n", qop="auth", algorithm=${algorithm}`);
      });
      const digestFetch = createDigestFetch({ credentials, fetch: server });
      await digestFetch('http://dav.test/a', { method: 'PROPFIND' });
      expect((await digestFetch('http://dav.test/b', { method: 'PROPFIND' })).status).toBe(207);
      expect(unauthorized).toBe(1);
    },
  );

  it('rotates the session cnonce when the server rotates its nonce', async () => {
    let nonce = 'n1';
    const server = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('authorization');
      if (auth && parseDigestParams(auth).nonce === nonce) return ok();
      return challenge(`realm="r", nonce="${nonce}", qop="auth", algorithm=MD5-sess`);
    });
    const digestFetch = createDigestFetch({ credentials, fetch: server });
    await digestFetch('http://dav.test/a');
    const before = parseDigestParams(
      new Headers(server.mock.calls[1][1]?.headers).get('authorization') ?? '',
    );
    nonce = 'n2';
    await digestFetch('http://dav.test/a');
    const after = parseDigestParams(
      new Headers(server.mock.calls[3][1]?.headers).get('authorization') ?? '',
    );
    expect(after.nc).toBe('00000001');
    expect(after.cnonce).not.toBe(before.cnonce);
  });

  it('does not authorize paths outside a declared domain, including after Basic negotiation', async () => {
    const server = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (new URL(String(input)).pathname === '/public') return ok();
      if (new Headers(init?.headers).get('authorization')?.startsWith('Digest ')) return ok();
      return challenge(
        'realm="r", nonce="n", qop="auth", domain="/dav/ /other/ http://foreign.test/"',
      );
    });
    const digestFetch = createDigestFetch({
      credentials,
      fetch: server,
      state: createDigestAuthState(false),
    });
    const init = { headers: { authorization: 'Basic original' } };
    await digestFetch('http://dav.test/dav/', init);
    await digestFetch('http://dav.test/other/a', init);
    await digestFetch('http://dav.test/public', init);
    expect(new Headers(server.mock.calls[2][1]?.headers).get('authorization')).toMatch(/^Digest /);
    expect(new Headers(server.mock.calls[3][1]?.headers).has('authorization')).toBe(false);
  });

  it('retains separate realms on the same origin', async () => {
    const server = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const realm = new URL(String(input)).pathname.startsWith('/a/') ? 'a' : 'b';
      const auth = new Headers(init?.headers).get('authorization');
      if (auth && parseDigestParams(auth).realm === realm) return ok();
      return challenge(`realm="${realm}", nonce="shared-nonce", qop="auth", domain="/${realm}/"`);
    });
    const digestFetch = createDigestFetch({ credentials, fetch: server });
    await digestFetch('http://dav.test/a/');
    await digestFetch('http://dav.test/b/');
    await digestFetch('http://dav.test/a/');
    expect(server).toHaveBeenCalledTimes(5);
    expect(
      parseDigestParams(new Headers(server.mock.calls[3][1]?.headers).get('authorization') ?? '')
        .nc,
    ).toBe('00000001');
    expect(
      parseDigestParams(new Headers(server.mock.calls[4][1]?.headers).get('authorization') ?? '')
        .realm,
    ).toBe('a');
  });

  it('selects MD5 when SHA-256 is offered but subtle is unavailable', async () => {
    const crypto = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      const server = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const auth = new Headers(init?.headers).get('authorization');
        if (auth) return ok();
        return challenge(
          'realm="r", nonce="n", qop="auth", algorithm=SHA-256, Digest realm="r", nonce="n", qop="auth", algorithm=MD5',
        );
      });
      expect(
        (await createDigestFetch({ credentials, fetch: server })('http://dav.test/a')).status,
      ).toBe(207);
      expect(
        parseDigestParams(new Headers(server.mock.calls[1][1]?.headers).get('authorization') ?? '')
          .algorithm,
      ).toBe('MD5');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('Digest redirect regressions', () => {
  it('omits browser-managed credentials by default and honors explicit cookie credentials', async () => {
    const server = createDigestServer({ ...credentials, handle: ok });
    const digestFetch = createDigestFetch({ credentials, fetch: server.fetch });
    await digestFetch('http://dav.test/a');
    expect(server.fetch.mock.calls[0][1]?.credentials).toBe('omit');
    await digestFetch('http://dav.test/a', { credentials: 'include' });
    expect(server.fetch.mock.calls[2][1]?.credentials).toBe('include');
  });
  it.each(['GET', 'HEAD'])(
    'signs the final URI after an opaque browser %s redirect',
    async (method) => {
      const target = createDigestServer({ ...credentials, handle: ok });
      const browserFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname === '/old' && init?.redirect === 'manual') return opaqueRedirect();
        const targetUrl = url.pathname === '/old' ? 'http://dav.test/new/' : url.href;
        const response = await target.fetch(targetUrl, init);
        Object.defineProperty(response, 'url', { value: targetUrl });
        return response;
      });
      expect(
        (
          await createDigestFetch({ credentials, fetch: browserFetch })('http://dav.test/old', {
            method,
          })
        ).status,
      ).toBe(207);
      expect(browserFetch).toHaveBeenCalledTimes(3);
      expect(parseDigestParams(target.authorizationOf(1) ?? '').uri).toBe('/new/');
    },
  );

  it.each(['PUT', 'DELETE', 'PROPFIND', 'REPORT'])(
    'does not replay %s after a browser hides the redirect status',
    async (method) => {
      const browserFetch = vi.fn(async () => opaqueRedirect());
      await expect(
        createDigestFetch({ credentials, fetch: browserFetch })('http://dav.test/old', { method }),
      ).rejects.toThrow('opaque browser redirect');
      expect(browserFetch).toHaveBeenCalledTimes(1);
    },
  );

  it('does not answer a foreign-origin challenge after an opaque redirect', async () => {
    const browserFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.redirect === 'manual') return opaqueRedirect();
      const response = challenge();
      Object.defineProperty(response, 'url', { value: 'http://foreign.test/private' });
      return response;
    });
    expect(
      (await createDigestFetch({ credentials, fetch: browserFetch })('http://dav.test/old')).status,
    ).toBe(401);
    expect(browserFetch).toHaveBeenCalledTimes(2);
    expect(new Headers(browserFetch.mock.calls[1][1]?.headers).has('authorization')).toBe(false);
  });

  it('signs the final URI when a Basic GET redirects before offering Digest', async () => {
    const target = createDigestServer({ ...credentials, handle: ok });
    const routed = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const targetUrl = url.pathname === '/old' ? 'http://dav.test/new/' : url.href;
      const response = await target.fetch(targetUrl, init);
      Object.defineProperty(response, 'url', { value: targetUrl });
      return response;
    });
    const digestFetch = createDigestFetch({
      credentials,
      fetch: routed,
      state: createDigestAuthState(false),
    });
    expect(
      (await digestFetch('http://dav.test/old', { headers: { authorization: 'Basic original' } }))
        .status,
    ).toBe(207);
    expect(String(routed.mock.calls[1][0])).toBe('http://dav.test/new/');
    expect(parseDigestParams(target.authorizationOf(1) ?? '').uri).toBe('/new/');
  });
});

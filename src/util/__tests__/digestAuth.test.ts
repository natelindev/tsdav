import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  buildDigestAuthorization,
  createDigestAuthState,
  createDigestFetch,
  parseAuthenticateHeader,
  selectDigestChallenge,
} from '../digestAuth';
import { createDigestServer, parseDigestParams } from './digestServer';

const md5 = (value: string) => createHash('md5').update(value).digest('hex');
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const credentials = { username: 'digestuser', password: 'digest-test-pw' };
const multistatus = () =>
  new Response('<d:multistatus xmlns:d="DAV:"/>', {
    status: 207,
    headers: { 'content-type': 'application/xml' },
  });

describe('parseAuthenticateHeader', () => {
  it('parses the Baikal default challenge', () => {
    expect(
      parseAuthenticateHeader(
        'Digest realm="BaikalDAV",qop="auth",nonce="6abef27466f7d",opaque="d66d5f0524036afcb61420e358f990ce"',
      ),
    ).toEqual([
      {
        scheme: 'digest',
        params: {
          realm: 'BaikalDAV',
          qop: 'auth',
          nonce: '6abef27466f7d',
          opaque: 'd66d5f0524036afcb61420e358f990ce',
        },
      },
    ]);
  });

  it('splits several challenges and unescapes quoted strings', () => {
    expect(
      parseAuthenticateHeader(
        'Basic realm="a \\"b\\"", Digest realm="r", qop="auth,auth-int", algorithm=SHA-256, nonce="n"',
      ),
    ).toEqual([
      { scheme: 'basic', params: { realm: 'a "b"' } },
      {
        scheme: 'digest',
        params: { realm: 'r', qop: 'auth,auth-int', algorithm: 'SHA-256', nonce: 'n' },
      },
    ]);
  });
});

describe('selectDigestChallenge', () => {
  it('defaults to MD5 and prefers SHA-256 when both are offered', () => {
    expect(selectDigestChallenge('Digest realm="r", nonce="n"')?.algorithm).toBe('MD5');
    expect(
      selectDigestChallenge(
        'Digest realm="r", nonce="n", algorithm=MD5, Digest realm="r", nonce="n", algorithm=SHA-256',
      )?.algorithm,
    ).toBe('SHA-256');
  });

  it('ignores challenges it cannot answer', () => {
    expect(selectDigestChallenge('Digest realm="r", nonce="n", qop="auth-int"')).toBeUndefined();
    expect(
      selectDigestChallenge('Digest realm="r", nonce="n", algorithm=SHA-512-256'),
    ).toBeUndefined();
    expect(
      selectDigestChallenge('Digest realm="r", nonce="n", algorithm=MD5-sess'),
    ).toBeUndefined();
    expect(selectDigestChallenge('Basic realm="r"')).toBeUndefined();
    expect(selectDigestChallenge(null)).toBeUndefined();
  });

  it('defers to Basic when asked to and the server accepts Basic', () => {
    const header = 'Basic realm="r", Digest realm="r", nonce="n"';
    expect(selectDigestChallenge(header, { unlessBasic: true })).toBeUndefined();
    expect(selectDigestChallenge(header)?.nonce).toBe('n');
  });

  it('reads the stale flag', () => {
    expect(selectDigestChallenge('Digest realm="r", nonce="n", stale=TRUE')?.stale).toBe(true);
  });
});

describe('buildDigestAuthorization', () => {
  // RFC 7616 §3.9.1
  const rfcExample = {
    username: 'Mufasa',
    password: 'Circle of Life',
    method: 'GET',
    uri: '/dir/index.html',
    nc: 1,
    cnonce: 'f2/wE4q74E6zIJEtWaHKaf5wv/H5QzzpXusqGemxURZJ',
  };
  const rfcChallenge = (algorithm: string) =>
    selectDigestChallenge(
      `Digest realm="http-auth@example.org", qop="auth, auth-int", algorithm=${algorithm}, nonce="7ypf/xlj9XXwfDPEoM4URrv/xwf94BcCAzFZH4GiTo0v", opaque="FQhe/qaU925kfnzjCev0ciny7QMkPqMAFRtzCUYo5tdS"`,
    );

  it('produces the RFC 7616 MD5 response', async () => {
    const challenge = rfcChallenge('MD5');
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({ ...rfcExample, challenge });
    expect(parseDigestParams(header)).toEqual({
      username: 'Mufasa',
      realm: 'http-auth@example.org',
      uri: '/dir/index.html',
      algorithm: 'MD5',
      nonce: '7ypf/xlj9XXwfDPEoM4URrv/xwf94BcCAzFZH4GiTo0v',
      nc: '00000001',
      cnonce: 'f2/wE4q74E6zIJEtWaHKaf5wv/H5QzzpXusqGemxURZJ',
      qop: 'auth',
      response: '8ca523f5e9506fed4657c9700eebdbec',
      opaque: 'FQhe/qaU925kfnzjCev0ciny7QMkPqMAFRtzCUYo5tdS',
    });
  });

  it('produces the RFC 7616 SHA-256 response', async () => {
    const challenge = rfcChallenge('SHA-256');
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({ ...rfcExample, challenge });
    expect(parseDigestParams(header).response).toBe(
      '753927fa0e85d155564e2e272a28d1802ca10daf4496794697cf8db5856cb6c1',
    );
    expect(parseDigestParams(header).algorithm).toBe('SHA-256');
  });

  it('uses the RFC 2069 form when the challenge has no qop', async () => {
    const challenge = selectDigestChallenge('Digest realm="r", nonce="n"');
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({ ...rfcExample, challenge });
    const params = parseDigestParams(header);
    expect(params.qop).toBeUndefined();
    expect(params.nc).toBeUndefined();
    expect(params.response).toBe(
      md5(`${md5('Mufasa:r:Circle of Life')}:n:${md5('GET:/dir/index.html')}`),
    );
  });

  it('derives the session key for MD5-sess', async () => {
    const challenge = selectDigestChallenge(
      'Digest realm="r", nonce="n", qop=auth, algorithm=MD5-sess',
    );
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({ ...rfcExample, challenge });
    const ha1 = md5(`${md5('Mufasa:r:Circle of Life')}:n:${rfcExample.cnonce}`);
    expect(parseDigestParams(header)).toMatchObject({
      algorithm: 'MD5-sess',
      response: md5(`${ha1}:n:00000001:${rfcExample.cnonce}:auth:${md5('GET:/dir/index.html')}`),
    });
  });

  it('derives the session key for SHA-256-sess', async () => {
    const challenge = selectDigestChallenge(
      'Digest realm="r", nonce="n", qop=auth, algorithm=SHA-256-sess',
    );
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({ ...rfcExample, challenge });
    const ha1 = sha256(`${sha256('Mufasa:r:Circle of Life')}:n:${rfcExample.cnonce}`);
    expect(parseDigestParams(header)).toMatchObject({
      algorithm: 'SHA-256-sess',
      response: sha256(
        `${ha1}:n:00000001:${rfcExample.cnonce}:auth:${sha256('GET:/dir/index.html')}`,
      ),
    });
  });

  it('sends a non-ASCII username as an RFC 5987 username*', async () => {
    const challenge = selectDigestChallenge('Digest realm="r", nonce="n", qop=auth');
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({
      ...rfcExample,
      username: "jürgen o'neil",
      challenge,
    });
    const ha1 = md5("jürgen o'neil:r:Circle of Life");
    expect(header).toContain("username*=UTF-8''j%C3%BCrgen%20o%27neil,");
    expect(header).not.toContain('username=');
    expect(parseDigestParams(header).response).toBe(
      md5(`${ha1}:n:00000001:${rfcExample.cnonce}:auth:${md5('GET:/dir/index.html')}`),
    );
  });

  it('escapes quotes and backslashes in a quoted username', async () => {
    const challenge = selectDigestChallenge('Digest realm="r", nonce="n", qop=auth');
    if (!challenge) throw new Error('challenge not parsed');
    const header = await buildDigestAuthorization({
      ...rfcExample,
      username: 'a"b\\c',
      challenge,
    });
    expect(header).toContain('username="a\\"b\\\\c",');
  });
});

describe('createDigestFetch', () => {
  const url = 'http://dav.test/dav.php/calendars/digestuser/';

  it('answers a challenge with one retry', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(url, {
      method: 'PROPFIND',
    });

    expect(response.status).toBe(207);
    expect(server.fetch).toHaveBeenCalledTimes(2);
    expect(server.authorizationOf(0)).toBeNull();
    expect(parseDigestParams(server.authorizationOf(1) ?? '')).toMatchObject({
      username: 'digestuser',
      uri: '/dav.php/calendars/digestuser/',
      nc: '00000001',
      qop: 'auth',
      opaque: 'opaque-1',
    });
  });

  it('authorizes later requests up front with an incrementing nonce count', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    const digestFetch = createDigestFetch({ credentials, fetch: server.fetch });
    await digestFetch(url, { method: 'PROPFIND' });
    const response = await digestFetch(`${url}event.ics?export`, { method: 'GET' });

    expect(response.status).toBe(207);
    expect(server.fetch).toHaveBeenCalledTimes(3);
    const params = parseDigestParams(server.authorizationOf(2) ?? '');
    expect(params).toMatchObject({
      nc: '00000002',
      uri: '/dav.php/calendars/digestuser/event.ics?export',
    });
    expect(params.cnonce).not.toBe(parseDigestParams(server.authorizationOf(1) ?? '').cnonce);
  });

  it('retries once with the new nonce when the old one is stale', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    const digestFetch = createDigestFetch({ credentials, fetch: server.fetch });
    await digestFetch(url, { method: 'PROPFIND' });
    server.rotateNonce();
    const response = await digestFetch(url, { method: 'PROPFIND' });

    expect(response.status).toBe(207);
    expect(server.fetch).toHaveBeenCalledTimes(4);
    expect(parseDigestParams(server.authorizationOf(3) ?? '')).toMatchObject({
      nonce: 'nonce-2',
      nc: '00000001',
    });
  });

  it('returns the 401 after a single retry when the password is wrong', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    const response = await createDigestFetch({
      credentials: { ...credentials, password: 'wrong' },
      fetch: server.fetch,
    })(url, { method: 'PROPFIND' });

    expect(response.status).toBe(401);
    expect(server.fetch).toHaveBeenCalledTimes(2);
  });

  it('resends the request body on retry', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: () => new Response(null, { status: 201 }),
    });
    const body = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n';
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(
      `${url}new.ics`,
      { method: 'PUT', body, headers: { 'Content-Type': 'text/calendar' } },
    );

    expect(response.status).toBe(201);
    expect(server.fetch.mock.calls.map(([, init]) => init?.body)).toEqual([body, body]);
    expect(new Headers(server.fetch.mock.calls[1][1]?.headers).get('content-type')).toBe(
      'text/calendar',
    );
  });

  it('does not retry a stream body, which can only be sent once', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(url, {
      method: 'PUT',
      body: new ReadableStream(),
    });

    expect(response.status).toBe(401);
    expect(server.fetch).toHaveBeenCalledTimes(1);
  });

  it('never falls back to Basic once Digest is in use', async () => {
    const basicOnly = vi.fn(
      async () =>
        new Response('', { status: 401, headers: { 'www-authenticate': 'Basic realm="r"' } }),
    );
    const response = await createDigestFetch({ credentials, fetch: basicOnly })(url);

    expect(response.status).toBe(401);
    expect(basicOnly).toHaveBeenCalledTimes(1);
  });

  it('keeps counting when parallel requests are challenged with the same nonce', async () => {
    const server = createDigestServer({ ...credentials, handle: multistatus });
    let unauthorized = 0;
    // The three 401s arrive one after another, each after the previous retry.
    const slowChallenges = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!new Headers(init?.headers).has('authorization')) {
        await new Promise((resolve) => setTimeout(resolve, 10 * unauthorized++));
      }
      return server.fetch(input, init);
    });
    const digestFetch = createDigestFetch({ credentials, fetch: slowChallenges });
    await Promise.all([1, 2, 3].map(() => digestFetch(url, { method: 'PROPFIND' })));

    const ncs = server.fetch.mock.calls
      .map((_, call) => server.authorizationOf(call))
      .filter((authorization) => authorization != null)
      .map((authorization) => parseDigestParams(authorization).nc);
    expect(ncs.sort()).toEqual(['00000001', '00000002', '00000003']);
  });

  it('follows redirects with an Authorization header for each hop', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: (_, path) => {
        if (path === '/old') {
          return new Response(null, { status: 301, headers: { location: '/sub%20dir' } });
        }
        if (path === '/sub%20dir') {
          return new Response(null, { status: 307, headers: { location: '/sub%20dir/' } });
        }
        return multistatus();
      },
    });
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(
      'http://dav.test/old',
      { method: 'PROPFIND', body: '<d:propfind xmlns:d="DAV:"/>' },
    );

    expect(response.status).toBe(207);
    const hops = server.fetch.mock.calls.slice(1).map(([input, init], call) => ({
      url: String(input),
      method: init?.method,
      body: init?.body,
      uri: parseDigestParams(server.authorizationOf(call + 1) ?? '').uri,
    }));
    const body = '<d:propfind xmlns:d="DAV:"/>';
    expect(hops).toEqual([
      { url: 'http://dav.test/old', method: 'PROPFIND', body, uri: '/old' },
      { url: 'http://dav.test/sub%20dir', method: 'PROPFIND', body, uri: '/sub%20dir' },
      { url: 'http://dav.test/sub%20dir/', method: 'PROPFIND', body, uri: '/sub%20dir/' },
    ]);
  });

  it('turns a 303 into a GET without body', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: (method) =>
        method === 'PUT'
          ? new Response(null, { status: 303, headers: { location: '/done' } })
          : new Response('ok'),
    });
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(
      'http://dav.test/upload',
      {
        method: 'PUT',
        body: 'data',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Encoding': 'gzip',
          'Content-Language': 'de',
          'Content-Location': '/upload',
          Depth: '0',
        },
      },
    );

    expect(response.status).toBe(200);
    const [input, init] = server.fetch.mock.calls[2];
    expect(String(input)).toBe('http://dav.test/done');
    expect(init).toMatchObject({ method: 'GET', body: undefined });
    expect([...new Headers(init?.headers).keys()].sort()).toEqual(['authorization', 'depth']);
    expect(parseDigestParams(server.authorizationOf(2) ?? '').uri).toBe('/done');
  });

  it('sends no credentials to another origin after a redirect', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: () =>
        new Response(null, { status: 302, headers: { location: 'http://other.test/x' } }),
    });
    const other = vi.fn(
      async () =>
        new Response('', {
          status: 401,
          headers: { 'www-authenticate': 'Digest realm="other", nonce="n", qop="auth"' },
        }),
    );
    const routed = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      new URL(String(input)).origin === 'http://other.test'
        ? other(input, init)
        : server.fetch(input, init),
    );
    const response = await createDigestFetch({ credentials, fetch: routed })(url, {
      headers: { authorization: 'Basic abc' },
    });

    expect(response.status).toBe(401);
    expect(other).toHaveBeenCalledTimes(1);
    expect(new Headers(other.mock.calls[0][1]?.headers).has('authorization')).toBe(false);
  });

  it('does not sign a hop back to the original origin once the chain left it', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: () => new Response(null, { status: 201 }),
    });
    const routed = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = new URL(String(input));
      if (target.origin === 'http://other.test') {
        return new Response(null, { status: 307, headers: { location: 'http://dav.test/victim' } });
      }
      if (target.pathname === '/bounce' && new Headers(init?.headers).has('authorization')) {
        return new Response(null, { status: 307, headers: { location: 'http://other.test/x' } });
      }
      return server.fetch(input, init);
    });
    const digestFetch = createDigestFetch({ credentials, fetch: routed });
    await digestFetch(url, { method: 'PROPFIND' });
    const response = await digestFetch('http://dav.test/bounce', { method: 'PUT', body: 'data' });

    expect(response.status).toBe(401);
    const [input, init] = routed.mock.calls[routed.mock.calls.length - 1];
    expect(String(input)).toBe('http://dav.test/victim');
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
  });

  // Not covered here: browsers answer redirect: 'manual' with an opaque
  // response, which the wrapper hands back to fetch to follow.
  it('gives up after 20 redirects, like fetch', async () => {
    const server = createDigestServer({
      ...credentials,
      handle: (_, path) => new Response(null, { status: 302, headers: { location: `${path}x` } }),
    });

    await expect(
      createDigestFetch({ credentials, fetch: server.fetch })('http://dav.test/loop'),
    ).rejects.toThrow('too many redirects');
    // The challenge, the request and its 20 redirects.
    expect(server.fetch).toHaveBeenCalledTimes(22);
  });

  it("leaves redirects to the caller with redirect: 'manual'", async () => {
    const server = createDigestServer({
      ...credentials,
      handle: () => new Response(null, { status: 301, headers: { location: '/elsewhere' } }),
    });
    const response = await createDigestFetch({ credentials, fetch: server.fetch })(url, {
      redirect: 'manual',
    });

    expect(response.status).toBe(301);
    expect(server.fetch).toHaveBeenCalledTimes(2);
  });

  it('needs crypto.subtle only for SHA-256', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array });
    try {
      const md5Server = createDigestServer({ ...credentials, handle: multistatus });
      const sha256Server = vi.fn(
        async () =>
          new Response('', {
            status: 401,
            headers: {
              'www-authenticate': 'Digest realm="r", nonce="n", qop="auth", algorithm=SHA-256',
            },
          }),
      );

      expect((await createDigestFetch({ credentials, fetch: md5Server.fetch })(url)).status).toBe(
        207,
      );
      await expect(createDigestFetch({ credentials, fetch: sha256Server })(url)).rejects.toThrow(
        'requires the WebCrypto API',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('fails clearly without WebCrypto', async () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const server = createDigestServer({ ...credentials, handle: multistatus });
      const digestFetch = createDigestFetch({ credentials, fetch: server.fetch });

      await expect(digestFetch(url)).rejects.toThrow('requires the WebCrypto API');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps a Basic client on Basic without WebCrypto', async () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const responses = [
        new Response('', {
          status: 401,
          headers: { 'www-authenticate': 'Digest realm="r", nonce="n", qop="auth"' },
        }),
        multistatus(),
      ];
      const server = vi.fn(async () => responses.shift() as Response);
      const state = createDigestAuthState(false);
      const digestFetch = createDigestFetch({ credentials, fetch: server, state });

      await expect(digestFetch(url)).rejects.toThrow('requires the WebCrypto API');
      expect(state.active).toBe(false);
      expect((await digestFetch(url)).status).toBe(207);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  describe('starting from Basic auth', () => {
    const basicInit = () => ({ method: 'PROPFIND', headers: { authorization: 'Basic abc' } });

    it('switches to Digest when the server only offers Digest', async () => {
      const server = createDigestServer({ ...credentials, handle: multistatus });
      const state = createDigestAuthState(false);
      const digestFetch = createDigestFetch({ credentials, fetch: server.fetch, state });
      const response = await digestFetch(url, basicInit());
      await digestFetch(url, basicInit());

      expect(response.status).toBe(207);
      expect(state.active).toBe(true);
      expect(server.fetch).toHaveBeenCalledTimes(3);
      expect(server.authorizationOf(0)).toBe('Basic abc');
      expect(server.authorizationOf(1)).toMatch(/^Digest .*nc=00000001/);
      expect(server.authorizationOf(2)).toMatch(/^Digest .*nc=00000002/);
    });

    it('answers the challenge only once when the password is wrong', async () => {
      const server = createDigestServer({ ...credentials, handle: multistatus });
      const response = await createDigestFetch({
        credentials: { ...credentials, password: 'wrong' },
        fetch: server.fetch,
        state: createDigestAuthState(false),
      })(url, basicInit());

      expect(response.status).toBe(401);
      expect(server.fetch).toHaveBeenCalledTimes(2);
    });

    it('stays on Basic when the server also offers Basic', async () => {
      const server = createDigestServer({ ...credentials, offerBasic: true, handle: multistatus });
      const state = createDigestAuthState(false);
      const response = await createDigestFetch({ credentials, fetch: server.fetch, state })(
        url,
        basicInit(),
      );

      expect(response.status).toBe(401);
      expect(state.active).toBe(false);
      expect(server.fetch).toHaveBeenCalledTimes(1);
    });

    it('passes requests through untouched when Basic succeeds', async () => {
      const basicServer = vi.fn(async () => multistatus());
      const init = basicInit();
      const response = await createDigestFetch({
        credentials,
        fetch: basicServer,
        state: createDigestAuthState(false),
      })(url, init);

      expect(response.status).toBe(207);
      expect(basicServer).toHaveBeenCalledTimes(1);
      expect(basicServer).toHaveBeenCalledWith(url, init);
    });

    it('ignores a Digest challenge from another origin that fetch was redirected to', async () => {
      const challenged = new Response('', {
        status: 401,
        headers: { 'www-authenticate': 'Digest realm="other", nonce="n", qop="auth"' },
      });
      Object.defineProperty(challenged, 'url', { value: 'http://other.test/x' });
      const server = vi.fn(async () => challenged);
      const state = createDigestAuthState(false);
      const response = await createDigestFetch({ credentials, fetch: server, state })(
        url,
        basicInit(),
      );

      expect(response.status).toBe(401);
      expect(state.active).toBe(false);
      expect(server).toHaveBeenCalledTimes(1);
    });

    it('copes with a fetch that reports a relative response url', async () => {
      const server = createDigestServer({ ...credentials, handle: multistatus });
      const relativeUrl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const response = await server.fetch(input, init);
        Object.defineProperty(response, 'url', { value: '/dav.php/calendars/digestuser/' });
        return response;
      });
      const digestFetch = createDigestFetch({
        credentials,
        fetch: relativeUrl,
        state: createDigestAuthState(false),
      });

      expect((await digestFetch(url, basicInit())).status).toBe(207);
      expect((await digestFetch(url, basicInit())).status).toBe(207);
      expect(server.fetch).toHaveBeenCalledTimes(3);
    });

    it('leaves redirects to fetch while Basic is in use', async () => {
      const basicServer = vi.fn(
        async () => new Response(null, { status: 301, headers: { location: '/elsewhere' } }),
      );
      const init = basicInit();
      await createDigestFetch({
        credentials,
        fetch: basicServer,
        state: createDigestAuthState(false),
      })(url, init);

      expect(basicServer).toHaveBeenCalledTimes(1);
      expect(basicServer).toHaveBeenCalledWith(url, init);
    });
  });
});

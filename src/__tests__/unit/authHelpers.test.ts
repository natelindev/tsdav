import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import {
  defaultParam,
  fetchOauthTokens,
  getBasicAuthHeaders,
  getOauthHeaders,
  refreshAccessToken,
  getBearerAuthHeaders,
} from '../../util/authHelpers';

test('defaultParam should be able to add default param', () => {
  const fn1 = (params: { a?: number; b?: number }) => {
    const { a = 0, b = 0 } = params;
    return a + b;
  };
  const fn2 = defaultParam(fn1, { b: 10 });
  const result = fn2({ a: 1 });
  expect(result).toEqual(11);
});

test('defaultParam added param should be able to be overridden', () => {
  const fn1 = (params: { a?: number; b?: number }) => {
    const { a = 0, b = 0 } = params;
    return a + b;
  };
  const fn2 = defaultParam(fn1, { b: 10 });
  const result = fn2({ a: 1, b: 3 });
  expect(result).toEqual(4);
});

test('getBasicAuthHeaders should return correct hash', () => {
  const { authorization } = getBasicAuthHeaders({
    username: 'test',
    password: '12345',
  });
  expect(authorization).toEqual('Basic dGVzdDoxMjM0NQ==');
});

test('getBearerAuthHeaders should return correct header', () => {
  const { authorization } = getBearerAuthHeaders({
    accessToken: 'test_token',
  });
  expect(authorization).toEqual('Bearer test_token');
});

test('fetchOauthTokens should rejects when missing args', async () => {
  const t = async () =>
    fetchOauthTokens({
      authorizationCode: '123',
    });
  expect(t).rejects.toThrow(
    'Oauth credentials missing: redirectUrl,clientId,clientSecret,tokenUrl',
  );
});

test('refreshAccessToken should rejects when missing args', async () => {
  const t = async () =>
    refreshAccessToken({
      authorizationCode: '123',
    });
  expect(t).rejects.toThrow(
    'Oauth credentials missing: refreshToken,clientId,clientSecret,tokenUrl',
  );
});

describe('fetchOauthTokens success', () => {
  it('should return tokens on successful response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'acc-token',
        refresh_token: 'ref-token',
        expires_in: 3600,
      }),
    });

    const tokens = await fetchOauthTokens(
      {
        authorizationCode: 'code123',
        redirectUrl: 'http://localhost/callback',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(tokens).toEqual({
      access_token: 'acc-token',
      refresh_token: 'ref-token',
      expires_in: 3600,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://example.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should return empty object on failed response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('error'),
    });

    const tokens = await fetchOauthTokens(
      {
        authorizationCode: 'code123',
        redirectUrl: 'http://localhost/callback',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(tokens).toEqual({});
  });
});

describe('refreshAccessToken success', () => {
  it('should return tokens on successful response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'new-acc-token',
        expires_in: 7200,
      }),
    });

    const tokens = await refreshAccessToken(
      {
        refreshToken: 'ref-token',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(tokens).toEqual({
      access_token: 'new-acc-token',
      expires_in: 7200,
    });
  });

  it('should return empty object on failed response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('error'),
    });

    const tokens = await refreshAccessToken(
      {
        refreshToken: 'ref-token',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(tokens).toEqual({});
  });
});

describe('getOauthHeaders', () => {
  it('should fetch new tokens when no refreshToken', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'fresh-token',
        refresh_token: 'ref',
        expires_in: 3600,
      }),
    });

    const result = await getOauthHeaders(
      {
        authorizationCode: 'code',
        redirectUrl: 'http://localhost/callback',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(result.headers.authorization).toBe('Bearer fresh-token');
    expect(result.tokens.access_token).toBe('fresh-token');
  });

  it('should refresh when has refreshToken but no accessToken', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'refreshed-token',
        expires_in: 3600,
      }),
    });

    const result = await getOauthHeaders(
      {
        refreshToken: 'ref-token',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(result.headers.authorization).toBe('Bearer refreshed-token');
    expect(result.tokens.access_token).toBe('refreshed-token');
  });

  it('should refresh when accessToken is expired', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'refreshed-token',
        expires_in: 3600,
      }),
    });

    const result = await getOauthHeaders(
      {
        refreshToken: 'ref-token',
        accessToken: 'old-token',
        expiration: Date.now() - 1000, // expired
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    expect(result.headers.authorization).toBe('Bearer refreshed-token');
  });

  it('should use existing accessToken when not expired', async () => {
    const mockFetch = vi.fn();

    const result = await getOauthHeaders(
      {
        refreshToken: 'ref-token',
        accessToken: 'valid-token',
        expiration: Date.now() + 100000, // not expired
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      undefined,
      mockFetch as any,
    );

    // Should not have fetched since token is not expired
    expect(mockFetch).not.toHaveBeenCalled();
    // Reuse the existing valid access token rather than emitting "Bearer undefined"
    expect(result.headers.authorization).toBe('Bearer valid-token');
    expect(result.tokens).toEqual({
      access_token: 'valid-token',
      refresh_token: 'ref-token',
    });
  });
});

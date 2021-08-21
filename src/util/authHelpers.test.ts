import {
  defaultParam,
  fetchOauthTokens,
  getBasicAuthHeaders,
  refreshAccessToken,
} from './authHelpers';

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

test('fetchOauthTokens should rejects when missing args', async () => {
  const t = async () =>
    fetchOauthTokens({
      authorizationCode: '123',
    });
  expect(t).rejects.toThrow(
    'Oauth credentials missing: redirectUrl,clientId,clientSecret,tokenUrl'
  );
});

test('refreshAccessToken should rejects when missing args', async () => {
  const t = async () =>
    refreshAccessToken({
      authorizationCode: '123',
    });
  expect(t).rejects.toThrow(
    'Oauth credentials missing: refreshToken,clientId,clientSecret,tokenUrl'
  );
});

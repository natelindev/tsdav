# AuthHelpers

### getBasicAuthHeaders

convert the `username:password` into base64 auth header string:

```ts
const result = getBasicAuthHeaders({
  username: 'test',
  password: '12345',
});
```

#### Return Value

```ts
{
  authorization: 'Basic dGVzdDoxMjM0NQ==';
}
```

### fetchOauthTokens

fetch oauth token using code obtained from oauth2 authorization code grant

```ts
const tokens = await fetchOauthTokens({
  authorizationCode: '123',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  tokenUrl: 'https://oauth.example.com/tokens',
  redirectUrl: 'https://yourdomain.com/oauth-callback',
});
```

#### Return Value

```ts
{
  access_token: 'kTKGQ2TBEqn03KJMM9AqIA';
  refresh_token: 'iHwWwqytfW3AfOjNbM1HLg';
  expires_in: 12800;
  id_token: 'TKfsafGQ2JMM9AqIA';
  token_type: 'bearer';
  scope: 'openid email';
}
```

### refreshAccessToken

using refresh token to fetch access token from given token endpoint

```ts
const result = await refreshAccessToken({
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  tokenUrl: 'https://oauth.example.com/tokens',
  refreshToken: 'iHwWwqytfW3AfOjNbM1HLg',
});
```

#### Return Value

```ts
{
  access_token: 'eeMCxYgdCF3xfLxgd1NE8A';
  expires_in: 12800;
}
```

### getOauthHeaders

the combination of `fetchOauthTokens` and `refreshAccessToken`, it will return the authorization header needed for authorizing the requests as well as automatically renewing the access token using refresh token obtained from server when it expires.

```ts
const result = await getOauthHeaders({
  authorizationCode: '123',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  tokenUrl: 'https://oauth.example.com/tokens',
  redirectUrl: 'https://yourdomain.com/oauth-callback',
});
```

#### Return Value

```ts
{
  tokens: {
    access_token: 'kTKGQ2TBEqn03KJMM9AqIA';
    refresh_token: 'iHwWwqytfW3AfOjNbM1HLg';
    expires_in: 12800;
    id_token: 'TKfsafGQ2JMM9AqIA';
    token_type: 'bearer';
    scope: 'openid email';
  },
  headers: {
    authorization: `Bearer q-2OCH2g3RctZOJOG9T2Q`,
  },
}
```

Both client APIs check OAuth expiry before each request and share one refresh for concurrent requests.
The credentials object is updated with the access token, a rotated refresh token when supplied, and
an expiration in milliseconds when `expires_in` is supplied. Persist those updated fields with your
credential storage. A refresh failure rejects the client request before sending DAV traffic. A valid
access token can be reused without a refresh token; an unknown expiry with an available refresh token
triggers refresh when authentication is first resolved.

### defaultParam

:::caution
Internal function, not intended to be used outside.
:::

Provide default parameter for passed in function and allows default parameters be overridden when the function was actually passed with same parameters.
would only work on functions that have only one object style parameter.

```ts
const fn1 = (params: { a?: number; b?: number }) => {
  const { a = 0, b = 0 } = params;
  return a + b;
};
const fn2 = defaultParam(fn1, { b: 10 });
```

### digest auth and custom auth

for digest auth (RFC 7616), pass `username` and `password` with `authMethod: 'Digest'`.
tsdav answers the server's `WWW-Authenticate` challenge itself and computes a fresh
`Authorization` header for every request (MD5, MD5-sess, SHA-256 and SHA-256-sess with
`qop=auth`, or the RFC 2069 form when the server sends no `qop`).
Digest needs the WebCrypto API (`globalThis.crypto`): Node.js >= 19, browsers, Bun or Deno.
On Node.js 18 a Digest request fails with a `DigestUnsupportedError` that says so.
While Digest is in use, tsdav follows redirects itself, since every hop needs its own
`Authorization` header. The returned `Response` then reports `redirected: false`; compare
`response.url` with the request URL if you need to know.

```ts
const client = await createDAVClient({
  serverUrl: 'https://baikal.example.com/dav.php',
  credentials: { username: 'user', password: 'password' },
  authMethod: 'Digest',
  defaultAccountType: 'caldav',
});
```

with `authMethod: 'Basic'`, a client switches to Digest on its own when the server answers
`401` with a Digest challenge and no Basic challenge, so servers such as Baikal that only
accept Digest work either way. A client never falls back from Digest to Basic.

a `digestString` in DAVCredentials (a precomputed header value) is still sent as-is when given.

for custom auth, you can pass additional data via `customData` prop to DAVCredentials,
you can pass in your custom auth function as `authFunction` param and will have DAVCredentials available to it.

### getBearerAuthHeaders

Generate Bearer authorization headers from an access token (useful for OIDC providers such as Nextcloud when supported).

```ts
const result = getBearerAuthHeaders({
  accessToken: 'YOUR_OIDC_ACCESS_TOKEN',
});
```

#### Return Value

```ts
{
  authorization: 'Bearer YOUR_OIDC_ACCESS_TOKEN',
}
```

---
title: 'AuthHelpers'
description: "Authentication utility functions for Basic, Bearer, and Digest credentials."
---

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

### Digest authentication

Pass `username` and `password` with `authMethod: 'Digest'`. Both `createDAVClient` and
`DAVClient` answer the server's `WWW-Authenticate` challenge and compute authorization
for each request, including discovery, object writes, and per-call `fetch` overrides.

```ts
import { createDAVClient } from 'tsdav';

const client = await createDAVClient({
  serverUrl: 'https://baikal.example.com/dav.php/',
  credentials: { username: 'user', password: 'password' },
  authMethod: 'Digest',
  defaultAccountType: 'caldav',
});
```

Supported algorithms are MD5, MD5-sess, SHA-256, and SHA-256-sess with `qop=auth`.
MD5 and SHA-256 also support the older form without `qop`. SHA-256 is preferred when
the runtime can compute it. Nonce counts increase per session, session keys persist for
`-sess` algorithms, and an expired nonce gets one retry. A 401 on that retry is returned
to the caller. Challenges without `domain` cover the origin; a supplied `domain` limits
preemptive authorization to those URL prefixes. Separate realms retain separate sessions.

The default `authMethod: 'Basic'` switches to Digest when a 401 from the same origin
offers Digest without Basic and WebCrypto is available. Without WebCrypto it retains
the original 401 behavior. A client using Digest does not fall back to Basic.

#### Runtime requirements

Digest requires `globalThis.crypto.getRandomValues`; SHA-256 also needs `crypto.subtle`.
These are available by default in Node.js >=19, Bun, Deno, Workers, and secure browser
contexts. On a browser's insecure HTTP origin, MD5 can work with `getRandomValues`,
but SHA-256 requires a secure context. Explicit Digest authentication throws
`DigestUnsupportedError` if the required crypto API is unavailable.

Node.js 18 remains supported. To enable Digest there, supply its built-in WebCrypto
before making client requests:

```ts
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}
```

#### Redirects and browser use

Use canonical server and collection URLs, including any required trailing slash.
When fetch exposes redirect statuses and `Location`, tsdav signs each same-origin hop,
preserves fetch's method/body conversion rules, and strips authorization when a chain
leaves the original origin. It does not answer challenges on that foreign origin.
`redirect: 'manual'` and `'error'` remain under the caller's control. Responses from
redirects followed manually can report `redirected: false`; compare `response.url` with
the requested URL instead.

Browsers return `opaqueredirect` for manual redirects and hide both their target and
status. For GET/HEAD, tsdav follows an unsigned request to resolve the final URL and
answers a same-origin challenge there. Other methods, including PROPFIND, REPORT, PUT,
and DELETE, throw a descriptive `TypeError` instead of replaying a request whose redirect
semantics are unknown. Use the final DAV URLs or a custom transport that exposes redirects
for those methods. An authenticated redirect that cannot be resolved without credentials
also needs the final URL. Cross-origin servers must allow CORS and expose
`WWW-Authenticate` to the browser.

While handling Digest, tsdav defaults fetch's `credentials` to `'omit'` to prevent the
browser's built-in HTTP authentication dialog from intercepting the challenge. Explicit
`fetchOptions.credentials` values are preserved; set `'include'` or `'same-origin'` if
your server also requires cookies. A browser client using Basic with automatic Digest
negotiation can set `fetchOptions: { credentials: 'omit' }` for the initial challenge too.

#### Overrides and limitations

A supplied `credentials.digestString` is still sent as-is with `authMethod: 'Digest'`,
even when username/password are present. This legacy option leaves challenge handling
to you. Explicit `Authorization` headers in request headers or `fetchOptions.headers`
also bypass automatic negotiation, and `headersToExclude: ['Authorization']` disables it.

`qop=auth-int`, SHA-512-256, username hashing (`userhash`), and `-sess` without `qop`
are not implemented. Credentials are hashed as UTF-8. `Authentication-Info`/`nextnonce`
is not processed; nonce rotation is handled by the next 401. Stream request bodies are
not retried. Use HTTPS to protect authentication and calendar/contact data in transit.

### Custom authentication

Pass an `authFunction` to return your request headers. It receives `DAVCredentials`,
including any additional values you supply in `customData`.

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

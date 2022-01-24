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

```ts
export type DAVCredentials = {
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationCode?: string;
  redirectUrl?: string;
  tokenUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiration?: number;
};
```

- `username` basic auth username
- `password` basic auth password
- `clientId` oauth client id
- `clientSecret` oauth client secret
- `authorizationCode` oauth callback auth code
- `redirectUrl` oauth callback redirect url
- `tokenUrl` oauth api token url
- `accessToken` oauth access token
- `refreshToken` oauth refresh token
- `expiration` oauth access token expiration time in ms
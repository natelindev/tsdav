---
title: 'DAVCredentials'
description: "TypeScript type definition for credentials supporting Basic, Bearer (OAuth), and Digest auth."
---

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
  digestString?: string;
  customData?: Record<string, unknown>;
};
```

refer to [this page](https://developers.google.com/identity/protocols/oauth2) for more on what these fields mean

- `username` Basic or Digest auth username
- `password` Basic or Digest auth password
- `clientId` oauth client id
- `clientSecret` oauth client secret
- `authorizationCode` oauth callback auth code
- `redirectUrl` oauth callback redirect url
- `tokenUrl` oauth api token url
- `accessToken` oauth access token
- `refreshToken` oauth refresh token
- `expiration` oauth access token expiration time
- `digestString` a precomputed digest string, sent as-is with `authMethod: 'Digest'`. Prefer `username` and `password`, which let tsdav answer the server's challenge
- `customData` custom data used for custom auth, can be anything

See [authentication helpers](../helpers/authHelpers.md#digest-authentication) for Digest
configuration, runtime requirements, redirects, and supported algorithms.

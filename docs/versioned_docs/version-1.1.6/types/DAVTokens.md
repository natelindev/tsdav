```ts
export type DAVTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  token_type?: string;
  scope?: string;
};
```

oauth token response

- `access_token` oauth access token
- `refresh_token` oauth refresh token
- `expires_in` token expires time in ms
- `id_token` oauth id token
- `token_type` oauth token type, usually `Bearer`
- `scope` oauth token scope
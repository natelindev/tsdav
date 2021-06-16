---
sidebar_position: 3
---

## `fetchPrincipalUrl`

fetch resource principle collection url

```ts
const url = await fetchPrincipalUrl({
  account: {
    serverUrl: 'https://caldav.icloud.com/',
    rootUrl: 'https://caldav.icloud.com/',
    accountType: 'caldav',
  },
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `account` **required**, account with `rootUrl` and `accountType`
- `headers` request headers

### Return Value

principle collection url

### Behavior

send current-user-principal PROPFIND request and extract principle collection url from xml response

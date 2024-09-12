---
sidebar_position: 3
---

## `fetchPrincipalUrl`

fetch resource principal collection url

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
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

principal collection url

### Behavior

send current-user-principal PROPFIND request and extract principal collection url from xml response

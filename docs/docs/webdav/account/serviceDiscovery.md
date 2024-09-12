---
sidebar_position: 2
---

## `serviceDiscovery`

automatically discover service root url

```ts
const url = await serviceDiscovery({
  account: { serverUrl: 'https://caldav.icloud.com/', accountType: 'caldav' },
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `account` **required**, account with `serverUrl` and `accountType`
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

root url

### Behavior

use `/.well-known/` request to follow redirects to find redirected url

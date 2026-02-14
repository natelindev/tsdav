---
sidebar_position: 1
---

## `createAccount`

construct webdav account information need to requests

```ts
const account = await createAccount({
  account: {
    serverUrl: 'https://caldav.icloud.com/',
    accountType: 'caldav',
  },
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
- `fetch` custom fetch implementation
- `loadCollections` defaults to false, whether to load all collections of the account
- `loadObjects` defaults to false, whether to load all objects of collections as well, must be used with `loadCollections` set to `true`

### Return Value

created [DAVAccount](../../types/DAVAccount.md)

### Behavior

perform [serviceDiscovery](serviceDiscovery.md),[fetchHomeUrl](fetchHomeUrl.md), [fetchPrincipalUrl](fetchPrincipalUrl.md) for account information gathering.
make fetch collections & fetch objects requests depend on options.

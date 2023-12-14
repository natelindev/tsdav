---
sidebar_position: 4
---

## `fetchHomeUrl`

fetch resource home set url

```ts
const url = await fetchHomeUrl({
  account: {
    principalUrl,
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

- `account` **required**, account with `principalUrl` and `accountType`
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

resource home set url

### Behavior

send calendar-home-set or addressbook-home-set (based on accountType) PROPFIND request and extract resource home set url from xml response

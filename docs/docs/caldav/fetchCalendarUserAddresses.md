---
sidebar_position: 4
---

## `fetchCalendarUserAddresses`

Fetch all calendar user addresses of the passed in CALDAV account

```ts
const addresses = await fetchCalendarUserAddresses({
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

- `account` **required**, account with `principalUrl`
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

Array of user addresses

Example of calendar user address:

- `mailto:john.doe@example.com`
- `/12345679/principal`
- `/aMjIxa0AwMRbhws5kZV25Wnb3-ZH0vD9R89O32XQwIxJV2zMDAwMTcwMjIxMD28Aa/principal/`
- `urn:uuid:12345679`

### Behavior

send calendar-user-address-set PROPFIND request and extract user addresses set from xml response

---
sidebar_position: 3
---

## `fetchAddressBooks`

get all addressBooks of the passed in CARDDAV account

```ts
const addressBooks = await fetchAddressBooks({
  account,
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `account` [DAVAccount](../types/DAVAccount.md)
- `props` [CARDDAV prop element](https://datatracker.ietf.org/doc/html/rfc6352#section-10.4.2) in [ElementCompact](../types/ElementCompact.md) form, overriding default props to fetch.
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

:::caution
when overriding props, resourcetype is required
:::

### Return Value

array of [DAVAddressBook](../types/DAVAddressBook.md)

### Behavior

use `PROPFIND` and to get all the basic info about addressBook on certain account

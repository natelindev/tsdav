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
- `headers` request headers

### Return Value

array of [DAVAddressBook](../types/DAVAddressBook.md)

### Behavior

use `PROPFIND` and to get all the basic info about addressBook on certain account

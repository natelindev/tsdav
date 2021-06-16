---
sidebar_position: 4
---

## `fetchVCards`

get all/specified vcards of the passed in addressBook

```ts
const vcards = await fetchVCards({
  addressBook: addressBooks[0],
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `addressBook` **required**, [DAVAddressBook](../types/DAVAddressBook.md) to fetch vcards from
- `objectUrls` vcard urls to fetch
- `headers` request headers

### Return Value

array of [DAVVCard](../types/DAVVCard.md)

### Behavior

a mix of [addressBookMultiGet](addressBookMultiGet.md) and [addressBookQuery](addressBookQuery.md), you can specify objectUrls here.

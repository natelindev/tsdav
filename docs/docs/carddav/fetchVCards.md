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
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function
  :::info
  some providers may return their objects with different suffixes such as `http://api.xx/97ec5f81-5ecc-4505-9621-08806f6796a3` or `http://api.xx/calobj1.abc`
  in this case, you can pass in your own object name filter
  :::
- `urlFilter` **default: no filter**predicate function to filter urls from the address book before fetching
  :::info
  some providers may not support addressBookMultiGet, then it's necessary to use addressBookQuery to fetch vcards.
  :::
- `useMultiGet` **default: true** whether to use [addressBookMultiGet](./addressBookMultiGet.md) as underlying function to fetch vcards, if set to false, it will use [addressBookQuery](./addressBookQuery.md) instead

### Return Value

array of [DAVVCard](../types/DAVVCard.md)

### Behavior

a mix of [addressBookMultiGet](addressBookMultiGet.md) and [addressBookQuery](addressBookQuery.md), you can specify objectUrls here.

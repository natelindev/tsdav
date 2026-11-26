---
title: 'fetchVCards'
sidebar_position: 4
description: "Fetch contact cards (vCards) from a CardDAV address book collection."
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

Unless `objectUrls` are given, lists the vcards of the address book with a `PROPFIND` (Depth 1), skipping the collection itself and sub-collections, then fetches them with [addressBookMultiGet](addressBookMultiGet.md) (or [addressBookQuery](addressBookQuery.md) when `useMultiGet` is false).
The listing does not use an `addressbook-query`, because some servers (such as OX App Suite, used by mailbox.org) answer its default `FN` prop-filter with an empty result.

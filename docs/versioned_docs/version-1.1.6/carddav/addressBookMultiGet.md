---
sidebar_position: 2
---

## `addressBookMultiGet`

addressBookMultiGet is used to retrieve specific
address object resources from within a collection.

If the Request-URI is an address object resource. This report is similar to the [addressBookQuery](addressBookQuery.md) except that it takes a list of vcard urls, instead of a filter, to determine which vcards to return.

```ts
// fetch 2 specific vcards from one addressBook
const vcards = await addressBookMultiGet({
  url: 'https://contacts.icloud.com/1234567/carddavhome/card/',
  props: [
    { name: 'getetag', namespace: DAVNamespace.DAV },
    { name: 'address-data', namespace: DAVNamespace.CARDDAV },
  ],
  objectUrls: [
    'https://contacts.icloud.com/1234567/carddavhome/card/1.vcf',
    'https://contacts.icloud.com/1234567/carddavhome/card/2.vcf',
  ],
  depth: '1',
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, url of CARDDAV server
- `objectUrls` **required**, urls of vcards to get
- `props` **required**, [DAVProp](../types/DAVProp.md) the client needs
- `filters` [DAVFilter](../types/DAVFilter.md) the filter on the vcards
- `depth` **required**, [DAVDepth](../types/DAVDepth.md) of the request
- `headers` request headers

### Return Value

array of [DAVVCard](../types/DAVVCard.md)

### Behavior

send carddav:addressbook-multiget REPORT request and parse the response xml to extract an array of [DAVVCard](../types/DAVVCard.md) data.

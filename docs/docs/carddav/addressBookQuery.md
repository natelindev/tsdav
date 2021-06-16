---
sidebar_position: 1
---

## `addressBookQuery`

performs a search for all address object resources that match a specified filter

The response of this report will contain all the WebDAV properties and address
object resource data specified in the request.

In the case of the `addressData` element, one can explicitly specify the
vCard properties that should be returned in the address object
resource data that matches the filter.

```ts
const addressbooks = await addressBookQuery({
  url: 'https://contacts.icloud.com/123456/carddavhome/card/',
  props: [{ name: 'getetag', namespace: DAVNamespace.DAV }],
  depth: '1',
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, request target url
- `props` **required**, array of [DAVProp](../types/DAVProp.md)
- `depth` [DAVDepth](../types/DAVDepth.md)
- `headers` request headers

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a addressbook-query REPORT request, after server applies the filters and parse the response xml to an array of [DAVResponse](../types/DAVResponse.md).

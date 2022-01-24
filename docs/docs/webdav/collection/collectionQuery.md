---
sidebar_position: 1
---

## `collectionQuery`

query on [DAVCollection](../../types/DAVCollection.md)

```ts
const result = await collectionQuery({
  url: 'https://contacts.icloud.com/123456/carddavhome/card/',
  body: {
    'addressbook-query': {
      _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
      [`${DAVNamespaceShort.DAV}:prop`]: props,
      filter: {
        'prop-filter': {
          _attributes: {
            name: 'FN',
          },
        },
      },
    },
  },
  defaultNamespace: DAVNamespaceShort.CARDDAV,
  depth: '1',
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, collection url
- `body` **required**, query request body
- `depth` [DAVDepth](../../types/DAVDepth.md)
- `defaultNamespace` defaults to `DAVNamespaceShort.DAV`, default namespace for the the request body
- `headers` request headers

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

send REPORT request on the target collection, parse response xml into array of [DAVResponse](../../types/DAVResponse.md)

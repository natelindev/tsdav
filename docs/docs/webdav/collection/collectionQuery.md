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
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

Sends a REPORT request to the target collection and parses the response XML into an array of [DAVResponse](../../types/DAVResponse.md).

### Error Handling

`collectionQuery` will reject with an error if:

- The server returns a non-OK response (e.g., 504 Gateway Timeout, 401 Unauthorized).
- Any individual response within a Multi-Status payload has a status code >= 400.
- The server response is not valid XML when a Multi-Status response is expected.

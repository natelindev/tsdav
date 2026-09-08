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
- `fetch` custom fetch implementation

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

Sends a REPORT request to the target collection and parses the response XML into an array of [DAVResponse](../../types/DAVResponse.md).

### Error Handling

`collectionQuery` will reject with an error if:

- The server returns a non-OK HTTP response (e.g., 504 Gateway Timeout, 401 Unauthorized).
- Any individual response within a Multi-Status payload has a status code >= 400, except a lone 404 with no properties. Some CalDAV servers answer an empty `calendar-query` that way instead of an empty `<D:multistatus/>` ([RFC 4791 §7.8](https://www.rfc-editor.org/rfc/rfc4791.html#section-7.8)); that is treated as no results.
- The server response is not valid XML when a Multi-Status response is expected.

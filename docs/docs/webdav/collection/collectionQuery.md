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
- Any individual response within a Multi-Status payload has a status code >= 400, except a lone collection-level 404 with no properties, propstat, or error element for a `calendar-query` using the CalDAV default namespace. Its href must match the queried collection (relative hrefs and trailing slashes are supported). This accommodates older Stalwart servers that used that response for empty queries instead of the empty `<D:multistatus/>` required by [RFC 4791 §7.8](https://www.rfc-editor.org/rfc/rfc4791.html#section-7.8). Object-level 404s and failures in other REPORT types still reject.
- The server response is not valid XML when a Multi-Status response is expected.

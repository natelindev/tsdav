---
sidebar_position: 5
---

## `syncCollection`

[One way to synchronize data between two entities is to use some form of synchronization token](https://datatracker.ietf.org/doc/html/rfc6578#section-3.2)

```ts
const result = await syncCollection({
  url: 'https://caldav.icloud.com/12345676/calendars/c623f6be-a2d4-4c60-932a-043e67025dde/',
  props: {
    [`${DAVNamespaceShort.DAV}:getetag`]: {},
    [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {},
    [`${DAVNamespaceShort.DAV}:displayname`]: {},
  },
  syncLevel: 1,
  syncToken: 'bb399205ff6ff07',
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, target collection url
- `props` **required**, [ElementCompact](../../types/ElementCompact.md)
- `syncLevel` [Indicates the "scope" of the synchronization report request](https://datatracker.ietf.org/doc/html/rfc6578#section-6.3)
- `syncToken` [The synchronization token provided by the server and returned by the client](https://datatracker.ietf.org/doc/html/rfc6578#section-6.2)
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

send sync-collection REPORT to target collection url, parse response xml into array of [DAVResponse](../../types/DAVResponse.md)

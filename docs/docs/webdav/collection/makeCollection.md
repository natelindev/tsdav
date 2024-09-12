---
sidebar_position: 2
---

## `makeCollection`

[create a new collection](https://datatracker.ietf.org/doc/html/rfc5689#section-3)

```ts
const response = await makeCollection({
  url: 'https://caldav.icloud.com/12345676/calendars/c623f6be-a2d4-4c60-932a-043e67025dde/',
  props: {
    displayname: 'my-calendar',
    [`${DAVNamespaceShort.CALDAV}:calendar-description`]: 'calendar description',
  },
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, url of the collection to create
- `props` [ElementCompact](../../types/ElementCompact.md) prop for the collection
- `depth` [DAVDepth](../../types/DAVDepth.md)
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

send MKCOL request and parse response xml into array of [DAVResponse](../../types/DAVResponse.md)

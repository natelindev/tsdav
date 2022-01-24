---
sidebar_position: 2
---

## `makeCollection`

[create a new collection](https://datatracker.ietf.org/doc/html/rfc5689#section-3)

```ts
const response = await makeCollection({
  url: 'https://caldav.icloud.com/12345676/calendars/c623f6be-a2d4-4c60-932a-043e67025dde/',
  props: [
    { name: 'displayname', value: builtInCalendars.APP },
    {
      name: 'calendar-description',
      value: 'random calendar description',
      namespace: DAVNamespace.CALDAV,
    },
  ],
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, url of the collection to create
- `props` array of [DAVProp](../../types/DAVProp.md) for the collection
- `depth` [DAVDepth](../../types/DAVDepth.md)
- `headers` request headers

### Return Value

array of [DAVResponse](../../types/DAVResponse.md)

### Behavior

send MKCOL request and parse response xml into array of [DAVResponse](../../types/DAVResponse.md)

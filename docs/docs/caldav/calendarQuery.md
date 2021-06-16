---
sidebar_position: 1
---

## `calendarQuery`

calendarQuery performs a search for all calendar object resources that match a specified filter.

The response of this report will contain all the WebDAV properties and calendar object resource data specified in the request.

In the case of the `calendarData` element, one can explicitly specify the calendar components and properties that should be returned in the calendar object resource data that matches the filter.

```ts
// fetch all objects of the calendar
const results = await calendarQuery({
  url: 'https://caldav.icloud.com/1234567/calendars/personal/',
  props: [{ name: 'getetag', namespace: DAVNamespace.DAV }],
  filters: [
    {
      type: 'comp-filter',
      attributes: { name: 'VCALENDAR' },
    },
  ],
  depth: '1',
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, request target url
- `props` **required**, array of [DAVProp](../types/DAVProp.md)
- `filters` array of [DAVFilter](../types/DAVFilter.md)
- `depth` [DAVDepth](../types/DAVDepth.md)
- `timezone` iana timezone name
- `headers` request headers

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a calendar-query REPORT request, after server applies the filters and parse the response xml to an array of [DAVResponse](../types/DAVResponse.md).

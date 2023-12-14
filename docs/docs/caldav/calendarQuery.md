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
      'comp-filter': {
        _attributes: {
          name: 'VCALENDAR',
        },
      },
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
- `props` **required**, [CALDAV prop element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.4) in [ElementCompact](../types/ElementCompact.md) form
- `filters` [CALDAV filter element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.7) in [ElementCompact](../types/ElementCompact.md) form
- `depth` [DAVDepth](../types/DAVDepth.md)
- `timezone` iana timezone name, like `America/Los_Angeles`
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a calendar-query REPORT request, after server applies the filters and parse the response xml to an array of [DAVResponse](../types/DAVResponse.md).

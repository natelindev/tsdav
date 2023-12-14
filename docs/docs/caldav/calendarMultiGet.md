---
sidebar_position: 2
---

## `calendarMultiGet`

calendarMultiGet is used to retrieve specific calendar object resources from within a collection.

If the Request-URI is a calendar object resource. This method is similar to the [calendarQuery](./calendarQuery.md), except that it takes a list of calendar object urls, instead of a filter, to determine which calendar objects to return.

```ts
// fetch 2 specific objects from one calendar
const calendarObjects = await calendarMultiGet({
  url: 'https://caldav.icloud.com/1234567/calendars/personal/',
  props: {
    [`${DAVNamespaceShort.DAV}:getetag`]: {},
    [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {},
  },
  objectUrls: [
    'https://caldav.icloud.com/1234567/calendars/personal/1.ics',
    'https://caldav.icloud.com/1234567/calendars/personal/2.ics',
  ],
  depth: '1',
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, url of CALDAV server
- `objectUrls` **required**, urls of calendar object to get
- `depth` **required**, [DAVDepth](../types/DAVDepth.md) of the request
- `props` [CALDAV prop element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.4) in [ElementCompact](../types/ElementCompact.md) form
- `filters` [CALDAV filter element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.7) in [ElementCompact](../types/ElementCompact.md) form
- `timezone` timezone of the calendar
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

array of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior

send caldav:calendar-multiget REPORT request and parse the response xml to extract an array of [DAVCalendarObject](../types/DAVCalendarObject.md) data.

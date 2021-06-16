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
  props: [
    { name: 'getetag', namespace: DAVNamespace.DAV },
    { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
  ],
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
- `props` [DAVProp](../types/DAVProp.md) the client needs
- `filters` [DAVFilter](../types/DAVFilter.md) the filter on the calendar objects
- `depth` **required**, [DAVDepth](../types/DAVDepth.md) of the request
- `timezone` timezone of the calendar
- `headers` request headers

### Return Value

array of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior

send caldav:calendar-multiget REPORT request and parse the response xml to extract an array of [DAVCalendarObject](../types/DAVCalendarObject.md) data.

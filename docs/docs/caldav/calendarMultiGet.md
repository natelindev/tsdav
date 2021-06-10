---
sidebar_position: 2

---

## `calendarMultiGet`

calendarMultiGet is used to retrieve specific calendar object resources from within a collection.

If the Request-URI is a calendar object resource. This method is similar to the [calendarQuery](./calendarQuery.md), except that it takes a list of calendar object urls, instead of a filter, to determine which calendar object resources to return.

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
    authorization: 'Basic x0C9u/Wd9Vz8OwS0DEAtkAlj'
  },
});
```

### Arguments

- `url` url of CALDAV server
- `props` [DAVProp](../types/DAVProp.md) the client needs
- `objectUrls` urls of calendar object to get
- `depth` [DAVDepth](../types/DAVDepth.md) of the request
- `headers` request headers


### Return Value

a list of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior


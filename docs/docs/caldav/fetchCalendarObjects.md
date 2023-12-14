---
sidebar_position: 7
---

## `fetchCalendarObjects`

get all/specified calendarObjects of the passed in calendar

```ts
const objects = await fetchCalendarObjects({
  calendar: calendars[0],
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `calendar` **required**, [DAVCalendar](../types/DAVCalendar.md) to fetch calendar objects from
- `objectUrls` calendar object urls to fetch
- `filters` [CALDAV filter element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.7) in [ElementCompact](../types/ElementCompact.md) form
- `timeRange` time range in iso format
  - `start` start time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), format that's not in ISO 8601 will cause an error be thrown.
  - `end` end time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), format that's not in ISO 8601 will cause an error be thrown.
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
  :::info
  some calendar providers may return their objects with different suffix than .ics such as `http://api.xx/97ec5f81-5ecc-4505-9621-08806f6796a3` or `http://api.xx/calobj1.abc`
  in this case, you need to pass in your own calendar object name filter so that you can have results you need.
  :::
- `urlFilter` **default: function which only keep .ics objects** predicate function to filter urls from the calendar objects before fetching
- `expand` whether to [expand](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.5) the calendar objects, forcing the server to expand recurring components into individual calendar objects.
  :::info
  some calendar providers may not support calendarMultiGet, then it's necessary to use calendarQuery to fetch calendar object data.
  :::
- `useMultiGet` **default: true** whether to use [calendarMultiGet](./calendarMultiGet.md) as underlying function to fetch calendar objects, if set to false, it will use [calendarQuery](./calendarQuery.md) to fetch instead.

### Return Value

array of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior

a mix of [calendarMultiGet](calendarMultiGet.md) and [calendarQuery](calendarQuery.md), you can specify both filters and objectUrls here.

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
- `urlFilter` predicate function to filter urls from the calendar objects before fetching
- `expand` whether to [expand](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.5) the calendar objects, forcing the server to expand recurring components into individual calendar objects.

### Return Value

array of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior

a mix of [calendarMultiGet](calendarMultiGet.md) and [calendarQuery](calendarQuery.md), you can specify both filters and objectUrls here.

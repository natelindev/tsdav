---
sidebar_position: 7
---

## `fetchCalendarObjects`

get all/specified calendarObjects of the passed in calendar

```ts
const objects = await fetchCalendarObjects({
  calendar: calendars[1],
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `calendar` **required**, [DAVCalendar](../types/DAVCalendar.md) to fetch calendar objects from
- `objectUrls` calendar object urls to fetch
- `filters` array of [DAVFilter](../types/DAVFilter.md)
- `timeRange` time range in iso format
  - `start` start time in ISO 8601 format
  - `end` end time in ISO 8601 format
- `headers` request headers

### Return Value

array of [DAVCalendarObject](../types/DAVCalendarObject.md)

### Behavior

a mix of [calendarMultiGet](calendarMultiGet.md) and [calendarQuery](calendarQuery.md), you can specify both filters and objectUrls here.

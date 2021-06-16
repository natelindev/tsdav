---
sidebar_position: 4
---

## `syncCalendars`

sync local version of calendars with remote.

```ts
const { created, updated, deleted } = await syncCalendars({
  oldCalendars: [
    {
      displayName: 'personal calendar',
      syncToken: 'HwoQEgwAAAAAAAAAAAAAAAAYARgAIhsI4pnF4erDm4CsARDdl6K9rqa9/pYBKAA=',
      ctag: '63758742166',
      url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/',
      objects: [
        {
          etag: '"63758758580"',
          id: '0003ffbe-cb71-49f5-bc7b-9fafdd756784',
          data: 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ZContent.net//Zap Calendar 1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nSUMMARY:Abraham Lincoln\nUID:c7614cff-3549-4a00-9152-d25cc1fe077d\nSEQUENCE:0\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=12\nDTSTART:20080212\nDTEND:20080213\nDTSTAMP:20150421T141403\nCATEGORIES:U.S. Presidents,Civil War People\nLOCATION:Hodgenville, Kentucky\nGEO:37.5739497;-85.7399606\nDESCRIPTION:Born February 12, 1809\nSixteenth President (1861-1865)\n\n\n\n \nhttp://AmericanHistoryCalendar.com\nURL:http://americanhistorycalendar.com/peoplecalendar/1,328-abraham-lincol\n n\nEND:VEVENT\nEND:VCALENDAR',
          url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/test.ics',
        },
      ],
    },
  ],
  detailedResult: true,
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

**required**

- `oldCalendars` **required**, locally version of calendars of this account, should contain [calendar objects](../types/DAVCalendarObject.md) as well if `detailedResult` is `false`
- `account` the account which calendars belong to,
- `detailedResult` if falsy, the result would be latest version of the calendars of this account, otherwise they would be separated into three groups of `created`, `updated`, and `deleted`.
- `headers` request headers

### Return Value

depend on `detailedResult` option

if `detailedResult` is falsy,

array of [DAVCalendar](../types/DAVCalendar.md) with calendar objects.

if `detailedResult` is `true`,

an object of

- `created` array of [DAVCalendar](../types/DAVCalendar.md) without calendar objects.
- `updated` array of [DAVCalendar](../types/DAVCalendar.md) without calendar objects.
- `deleted` array of [DAVCalendar](../types/DAVCalendar.md) without calendar objects.

### Behavior

fetch the latest list of [DAVCalendar](../types/DAVCalendar.md) from remote,

compare the provided list and the latest list to find out `created`, `updated`, and `deleted` calendars.

if `detailedResult` is falsy,

fetch the latest list of [DAVCalendarObject](../types/DAVCalendarObject.md) from updated calendars using [rfc6578 webdav sync](https://datatracker.ietf.org/doc/html/rfc6578) and [calendarMultiGet](calendarMultiGet.md)

return latest list of calendars with latest list of objects for `updated` calendars.

if `detailedResult` is `true`,

return three list of separate calendars without objects for `created`, `updated`, and `deleted`.

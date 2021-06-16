---
sidebar_position: 6
---

## `smartCollectionSync`

smart version of collection sync that combines ctag based sync with webdav sync.

```ts
const { created, updated, deleted } = (
  await smartCollectionSync({
    collection: {
      url: 'https://caldav.icloud.com/12345676/calendars/c623f6be-a2d4-4c60-932a-043e67025dde/',
      ctag: 'eWd9Vz8OwS0DE==',
      syncToken: 'eWdLSfo8439Vz8OwS0DE==',
      objects: [
        {
          etag: '"63758758580"',
          id: '0003ffbe-cb71-49f5-bc7b-9fafdd756784',
          data: 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ZContent.net//Zap Calendar 1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nSUMMARY:Abraham Lincoln\nUID:c7614cff-3549-4a00-9152-d25cc1fe077d\nSEQUENCE:0\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=12\nDTSTART:20080212\nDTEND:20080213\nDTSTAMP:20150421T141403\nCATEGORIES:U.S. Presidents,Civil War People\nLOCATION:Hodgenville, Kentucky\nGEO:37.5739497;-85.7399606\nDESCRIPTION:Born February 12, 1809\nSixteenth President (1861-1865)\n\n\n\n \nhttp://AmericanHistoryCalendar.com\nURL:http://americanhistorycalendar.com/peoplecalendar/1,328-abraham-lincol\n n\nEND:VEVENT\nEND:VCALENDAR',
          url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/test.ics',
        },
      ],
      objectMultiGet: calendarMultiGet,
    },
    method: 'webdav',
    detailedResult: true,
    account: {
      accountType: 'caldav',
      homeUrl: 'https://caldav.icloud.com/123456/calendars/',
    },
    headers: {
      authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
    },
  })
).objects;
```

### Arguments

- `collection` **required**, the target collection to sync
- `method` defaults to auto detect, one of `basic` and `webdav`
- `account` [DAVAccount](../../types/DAVAccount.md) to sync
- `detailedResult` boolean indicate whether the return value should be detailed or not
- `headers` request headers

### Return Value

depend on `detailedResult` option

if `detailedResult` is falsy,

array of latest [DAVObject](../../types/DAVObject.md)

if `detailedResult` is `true`,

an object of

- `objects`
  - `created` array of [DAVObject](../../types/DAVObject.md)
  - `updated` array of [DAVObject](../../types/DAVObject.md)
  - `deleted` array of [DAVObject](../../types/DAVObject.md)

### Behavior

detect if collection support sync-collection REPORT

if they supports, use [rfc6578 webdav sync](https://datatracker.ietf.org/doc/html/rfc6578) to detect if collection changed,

else use ctag to detect if collection changed.

if collection changed,
fetch the latest list of [DAVObject](../../types/DAVObject.md) from remote,

compare the provided list and the latest list to find out `created`, `updated`, and `deleted` objects.

if `detailedResult` is falsy,

fetch the latest list of [DAVObject](../../types/DAVObject.md) from changed collection using [rfc6578 webdav sync](https://datatracker.ietf.org/doc/html/rfc6578) and `objectMultiGet`

if `detailedResult` is `true`,

return three list of separate objects for `created`, `updated`, and `deleted`

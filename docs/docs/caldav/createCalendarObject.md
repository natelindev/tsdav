---
sidebar_position: 8
---

## `createCalendarObject`

create one calendar object on the target calendar

```ts
const result = await createCalendarObject({
  calendar: calendars[0],
  filename: 'test.ics'
  iCalString: 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ZContent.net//Zap Calendar 1.0//EN\nBEGIN:VEVENT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nSUMMARY:Abraham Lincoln\nUID:c7614cff-3549-4a00-9152-d25cc1fe077d\nSEQUENCE:0\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=12\nDTSTART:20080212T182145Z\nDTEND:20080213T182145Z\nDTSTAMP:20150421T182145Z\nCATEGORIES:U.S. Presidents,Civil War People\nLOCATION:Hodgenville, Kentucky\nGEO:37.5739497;-85.7399606\nDESCRIPTION:Born February 12, 1809 Sixteenth President (1861-1865) http\://AmericanHistoryCalendar.com\nURL:http\://americanhistorycalendar.com/peoplecalendar/1,328-abraham-lincoln\nEND:VEVENT\nEND:VCALENDAR',
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `calendar` **required**, the [DAVCalendar](../types/DAVCalendar.md) which the client wish to create object on.
- `filename` **required**, file name of the new calendar object, should end in `.ics`
- `iCalString` **required**, calendar file data
- `headers` request headers

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

use PUT request to create a new calendar object

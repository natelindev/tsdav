---
sidebar_position: 10
---

## `deleteCalendarObject`

delete one calendar object on the target calendar

```ts
const result = await deleteCalendarObject({
  calendarObject: {
    url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/test.ics',
    etag: '"63758758580"',
  },
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `calendarObject` **required**, [DAVCalendarObject](../types/DAVCalendarObject.md) to delete
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

use DELETE request to delete a new calendar object

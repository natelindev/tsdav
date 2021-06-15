---
sidebar_position: 8
---

## `createCalendarObject`

create one calendar object on the target calendar

```ts
const result = await createCalendarObject({
  calendar: calendars[1],
  filename: 'test.ics'
  data: iCalString,
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

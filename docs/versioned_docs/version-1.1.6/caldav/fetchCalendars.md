---
sidebar_position: 3
---

## `fetchCalendars`

get all calendars of the passed in CALDAV account

```ts
const calendars = await fetchCalendars({
  account,
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `account` [DAVAccount](../types/DAVAccount.md)
- `header` request headers

### Return Value

array of [DAVCalendar](../types/DAVCalendar.md) of the account

### Behavior

use `PROPFIND` to get all the basic info about calendars on certain account

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
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function
- `fetch` custom fetch implementation
- `props` [CALDAV prop element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.4) in [ElementCompact](../types/ElementCompact.md) form, overriding default props to fetch
- `projectedProps` custom props projection object, used as a map to map fetched custom props to values
  :::caution
  when overriding props, supported-calendar-component-set and resourcetype are required
  :::

### Return Value

array of [DAVCalendar](../types/DAVCalendar.md) of the account

### Behavior

use `PROPFIND` to get all the basic info about calendars on certain account

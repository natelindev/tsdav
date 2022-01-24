---
sidebar_position: 5
---

## `makeCalendar`

create a new calendar on target account

```ts
const result = await makeCalendar({
  url: 'https://caldav.icloud.com/12345676/calendars/c623f6be-a2d4-4c60-932a-043e67025dde/',
  props: {
    displayname: 'personal calendar',
    [`${DAVNamespaceShort.CALDAV}:calendar-description`]: 'calendar description',
  },
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, the target url
- `props` **required**, [CALDAV prop element](https://datatracker.ietf.org/doc/html/rfc4791#section-9.6.4) in [ElementCompact](../types/ElementCompact.md) form
- `depth` [DAVDepth](../types/DAVDepth.md)
- `headers` request headers

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a MKCALENDAR request and calendar data that creates a new calendar

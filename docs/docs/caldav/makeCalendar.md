---
sidebar_position: 5
---

## `makeCalendar`

create a new calendar on target account

```ts
const result = await makeCalendar(URL.resolve(account.homeUrl, uuid.v4()), [
  { name: 'displayname', value: builtInCalendars.APP },
  {
    name: 'calendar-description',
    value:
      'This calendar is created by crimson app, please do not modify the name or the content of this calendar',
    namespace: DAVNamespace.CALDAV,
    headers: {
      authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
    },
  },
]);
```

### Arguments

- `url` **required**, the target url
- `props` **required**, array of [DAVProp](../types/DAVProp.md)
- `depth` [DAVDepth](../types/DAVDepth.md)
- `headers` request headers

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a MKCALENDAR request and calendar data that creates a new calendar

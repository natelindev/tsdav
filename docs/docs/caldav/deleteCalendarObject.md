---
sidebar_position: 10

---

## `deleteCalendarObject`

delete one calendar object on the target calendar

```ts
const result = await deleteObject({
  url: 'https://caldav.icloud.com/1234567/calendars/personal/1.ics',
  headers: {
    authorization: 'Basic x0C9u/Wd9Vz8OwS0DEAtkAlj'
  }
});
```

### Arguments

### Return Value
standard [fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior
---
sidebar_position: 10
---

## `freeBusyQuery`

query free busy data on calendar

:::caution
a lot of caldav providers do not support this method like google, apple.
use with caution.
:::

```ts
const freeBusyQuery = await freeBusyQuery({
  url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/',
  timeRange: {
    start: '2022-01-28T16:25:33.125Z',
    end: '2022-02-28T16:25:33.125Z',
  },
  depth: '0',
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, collection url
- `timeRange` **required** time range in iso format
  - `start` start time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), format that's not in ISO 8601 will cause an error be thrown.
  - `end` end time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), format that's not in ISO 8601 will cause an error be thrown.
- `depth` [DAVDepth](../types/DAVDepth.md)
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

[DAVResponse](../types/DAVResponse.md)

### Behavior

send free-busy-query REPORT request to caldav server.

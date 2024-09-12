---
sidebar_position: 4
---

## `supportedReportSet`

identifies the [reports that are supported by the resource](https://datatracker.ietf.org/doc/html/rfc3253#section-3.1.5)

```ts
const reports = await supportedReportSet({
  collection,
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `collection` **required**, [DAVCollection](../../types/DAVCollection.md) to query on
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function

### Return Value

array of supported REPORT name in camelCase

### Behavior

send supported-report-set PROPFIND request and parse response xml to extract names and convert them to camel case.

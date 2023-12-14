---
sidebar_position: 2
---

## `propfind`

The [PROPFIND](https://datatracker.ietf.org/doc/html/rfc4918#section-9.1) method retrieves properties defined on the resource identified by the Request-URI

```ts
const [result] = await propfind({
  url: 'https://caldav.icloud.com/',
  props: [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, request url
- `props` **required**, [ElementCompact](../types/ElementCompact.md) props to find
- `depth` [DAVDepth](../types/DAVDepth.md)
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

### Behavior

send a prop find request, parse the response xml to an array of [DAVResponse](../types/DAVResponse.md).

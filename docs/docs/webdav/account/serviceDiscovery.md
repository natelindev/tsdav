---
sidebar_position: 2
---

## `serviceDiscovery`

automatically discover service root url

```ts
const url = await serviceDiscovery({
  account: { serverUrl: 'https://caldav.icloud.com/', accountType: 'caldav' },
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `account` **required**, account with `serverUrl` and `accountType`
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `fetchOptions` options to pass to underlying fetch function
- `fetch` custom fetch implementation

### Return Value

root url

### Behavior

Requests `/.well-known/caldav` or `/.well-known/carddav` on the server's origin using
`PROPFIND`, then tries `GET` if necessary. Relative `Location` headers resolve against
that discovery request URL. For example, `Location: ../dav/` resolves to `/dav/`, even
when `serverUrl` contains a nested calendar path.

Path-relative redirects retain the request's origin and port. Absolute and
protocol-relative redirects use their own host and port, including the protocol's
default port when none is specified.

Discovery controls the method, body, and manual redirect handling. A `body` supplied
in `fetchOptions` is not sent with the `GET` fallback; other transport options and
headers still apply. If neither request redirects, the function returns `serverUrl`
as a normalized URL.

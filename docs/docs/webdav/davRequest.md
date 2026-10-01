---
sidebar_position: 1
---

## `davRequest`

core request function of the library,
built on top of the standards-compliant `fetch` exposed by every supported
runtime (Node.js >= 18, modern browsers, Bun, Deno, Cloudflare Workers,
Electron). `xml-js` is used so that plain JS objects can be passed as the
request body.

```ts
const [result] = await davRequest({
  url: 'https://caldav.icloud.com/',
  init: {
    method: 'PROPFIND',
    namespace: 'd',
    body: {
      propfind: {
        _attributes: {
          'xmlns:d': 'DAV:',
        },
        prop: { 'd:current-user-principal': {} },
      },
    },
    headers: {
      authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
    },
  },
});
```

### Arguments

- `url` **required**, request url
- `init` **required**, [DAVRequest](davRequest.md) Object
- `convertIncoming` defaults to `true`, whether to convert the passed in init object request body, if `false`, davRequest would expect `init->body` is `xml` string, and would send it directly to target `url` without processing.
- `parseOutgoing` defaults to `true`, whether to parse the return value in response body, if `false`, the response `raw` would be raw `xml` string returned from server.
- `headersToExclude` case-insensitive header names to remove after merging defaults, request headers, and `fetchOptions.headers`
- `fetchOptions` options to pass to underlying fetch function
- `fetch` custom fetch implementation to override the runtime's native `fetch`

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

- response-> raw will be `string` if `parseOutgoing` is `false` or request failed.

### Behavior

depend on options, use `xml-js` to convert passed in json object into valid xml request,
also use `xml-js` to convert received xml response into json object.
if request failed, response-> raw will be raw response text returned from server.

Multistatus responses without resource entries still return one result with the parsed `raw` payload,
so callers can read collection metadata such as `raw.multistatus.syncToken`. Status codes are parsed
even when the server omits the reason phrase.

Successful unparsed response bodies are preserved in full. Parsed property failures remain available
in `propStats`; `props` includes only successful properties, and an all-failed propstat response has
`ok: false`. Malformed XML has `ok: false` and a `parseError`.

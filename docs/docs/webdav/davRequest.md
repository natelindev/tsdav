---
sidebar_position: 1
---

## `davRequest`

core request function of the library,
using `xml-js` so that js objects can be passed as request.

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
- `fetchOptions` options to pass to underlying fetch function

### Return Value

array of [DAVResponse](../types/DAVResponse.md)

- response-> raw will be `string` if `parseOutgoing` is `false` or request failed.

### Behavior

depend on options, use `xml-js` to convert passed in json object into valid xml request,
also use `xml-js` to convert received xml response into json object.
if request failed, response-> raw will be raw response text returned from server.

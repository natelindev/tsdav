```ts
export type DAVResponse = {
  raw?: any;
  href?: string;
  parseError?: string;
  propStats?: DAVPropStat[];
  status: number;
  statusText: string;
  ok: boolean;
  error?: { [key: string]: any };
  responsedescription?: string;
  props?: { [key: string]: { status: number; statusText: string; ok: boolean; value: any } | any };
};
```

sample DAVResponse

```json
{
  "raw": {
    "multistatus": {
      "response": {
        "href": "/",
        "propstat": {
          "prop": {
            "currentUserPrincipal": { "href": "/123456/principal/" }
          },
          "status": "HTTP/1.1 200 OK"
        }
      }
    }
  },
  "href": "/",
  "status": 207,
  "statusText": "Multi-Status",
  "ok": true,
  "props": { "currentUserPrincipal": { "href": "/123456/principal/" } }
}
```

response type of [davRequest](../webdav/davRequest.md)

- `raw` the entire [response](https://datatracker.ietf.org/doc/html/rfc4918#section-14.24) object, useful when need something that is not a prop or href
- `href` [content element URI](https://datatracker.ietf.org/doc/html/rfc2518#section-12.3)
- `status` resource status, an all-failed property status, or the HTTP response status
- `statusText` fetch response statusText
- `ok` whether the resource response has a successful status; false when all returned properties fail
- `error` error object from error response
- `responsedescription` [information about a status response within a
      Multi-Status](https://datatracker.ietf.org/doc/html/rfc4918#section-14.25)
- `props` response [propstat](https://datatracker.ietf.org/doc/html/rfc4918#section-14.22) props with camel case names.

`propStats` preserves each property's status, properties, namespace URI map (`namespaces`), and
optional error/description. `props` contains only successful properties. A response whose every
property failed has `ok: false`; mixed results require inspecting the statuses of the properties you
need. XML text stays a string, including numeric-looking display names and opaque tokens. Pure CDATA
uses `{ _cdata: string }`; mixed text and CDATA are joined in document order. When namespaces share a
local name, DAV names retain their usual key and colliding names use `{namespaceURI}localName`.

`raw` preserves the complete body for unparsed responses. A malformed XML response has `ok: false`
and `parseError`, so callers can distinguish parsing failures from a successful empty result.

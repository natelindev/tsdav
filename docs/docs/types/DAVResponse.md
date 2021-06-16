```ts
export type DAVResponse = {
  raw?: any;
  href?: string;
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
- `status` fetch response status
- `statusText` fetch response statusText
- `ok` fetch response ok
- `error` error object from error response
- `responsedescription` [information about a status response within a
      Multi-Status](https://datatracker.ietf.org/doc/html/rfc4918#section-14.25)
- `props` response [propstat](https://datatracker.ietf.org/doc/html/rfc4918#section-14.22) props with camel case names.

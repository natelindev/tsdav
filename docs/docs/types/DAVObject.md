```ts
export type DAVObject = {
  data?: any;
  etag?: string;
  url: string;
};
```

- `data` the raw content of an WEBDAV object.
- `etag` the version string of content, if [etag](https://tools.ietf.org/id/draft-reschke-http-etag-on-write-08.html) changed, `data` must have been changed.
- `url` url of the WEBDAV object.
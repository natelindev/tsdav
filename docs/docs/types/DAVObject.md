```ts
export type DAVObject = {
  data?: any;
  etag: string;
  url: string;
};
```

- `data` the raw content of an WEBDAV object.
- `etag` the version string of content, if etag changed, `data` must have been changed.
- `url` url of the WEBDAV object.
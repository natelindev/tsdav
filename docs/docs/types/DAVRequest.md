```ts
export type DAVRequest = {
  headers?: Record<string, string>;
  method: DAVMethods | HTTPMethods;
  body: any;
  namespace?: string;
  attributes?: Record<string, string>;
};
```

[davRequest](../webdav/davRequest.md) init body

- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude
- `method` request method
- `body` request body
- `namespace` default namespace for all xml nodes
- `attributes` root node xml attributes

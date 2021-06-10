```ts
export type DAVRequest = {
  headers?: Record<string, string>;
  method: DAVMethods | HTTPMethods;
  body: any;
  namespace?: string;
  attributes?: Record<string, string>;
};
```
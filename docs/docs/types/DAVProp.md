```ts
export type DAVProp = {
  name: string;
  namespace?: DAVNamespace;
  value?: string | number;
};
```

props of the webdav requests and response

- `name` name of the prop
- `namespace` xml namespace of the prop
- `value` value of the prop
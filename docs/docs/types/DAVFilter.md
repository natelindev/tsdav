```ts
export type DAVFilter = {
  type: string;
  attributes: Record<string, string>;
  value?: string | number;
  children?: DAVFilter[];
};
```

a [filter](https://datatracker.ietf.org/doc/html/rfc4791#section-9.7) to limit the set of calendar components returned by the server.
- `type` prop-filter, comp-filter and param-filter
- `attributes` xml attributes of the filter
- `value` value of the filter
- `children` child filters
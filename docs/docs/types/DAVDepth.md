```ts
export type DAVDepth = '0' | '1' | 'infinity';
```

[depth header](https://datatracker.ietf.org/doc/html/rfc4918#section-10.2) of webdav requests
| Depth    | Action apply to                                   |
| -------- | ------------------------------------------ |
| 0        | only the resource                          |
| 1        | the resource and its internal members only |
| infinity | the resource and all its members           |
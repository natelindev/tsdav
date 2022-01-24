# RequestHelpers

:::caution
All functions below are intended to only be used internally
and may subject to change without notice.
:::

### urlEquals

Check if two urls are mostly equal

Will first trim out white spaces, and can omit the last `/`

For example, `https://www.example.com/` and ` https://www.example.com` are considered equal

### urlContains

Basically `urlEqual`, but without length constraint.

For example, `https://www.example.com/` and ` www.example.com` are considered contains.

### mergeObjectDupKeyArray

merge two objects, same key property become array

For example:

```ts
{
  test1: 123,
  test2: 'aaa',
  test4: {
    test5: {
      test6: 'bbb',
    },
  },
  test7: 'ooo',
}
```

and

```ts
{
  test1: 234,
  test2: 'ccc',
  test4: {
    test5: {
      test6: 'ddd',
    },
  },
  test8: 'ttt',
}
```

After merge, becomes:

```ts
{
  test1: [234, 123],
  test2: ['ccc', 'aaa'],
  test4: [{ test5: { test6: 'ddd' } }, { test5: { test6: 'bbb' } }],
  test7: 'ooo',
  test8: 'ttt',
}
```

### getDAVAttribute

Convert `DAVNamespace` to intended format to be consumed by `xml-js` to be used as `xml` attributes.

### formatProps

Format `DAVProp` to intended format to be consumed by `xml-js` and converted to correct format for `WEBDAV` standard.

### formatFilters

Format `DAVFilter` to intended format to be consumed by `xml-js` and converted to correct format for `WEBDAV` standard.

### cleanupFalsy

Clean up `falsy` values within an object, this is useful when sending headers,

Where undefined object property will cause an error.

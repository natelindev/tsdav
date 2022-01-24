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

### getDAVAttribute

Convert `DAVNamespace` to intended format to be consumed by `xml-js` to be used as `xml` attributes.

### cleanupFalsy

Clean up `falsy` values within an object, this is useful when sending headers,

Where undefined object property will cause an error.

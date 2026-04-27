// Convert hyphen/underscore separated strings to camelCase. Collapses runs of
// consecutive separators so inputs like `foo--bar` and `foo_-bar` both produce
// `fooBar` instead of leaking stray separators into the result.
export const camelCase = (str: string): string =>
  str.replace(/[-_]+(\w?)/g, (_m, c: string) => (c ? c.toUpperCase() : ''));

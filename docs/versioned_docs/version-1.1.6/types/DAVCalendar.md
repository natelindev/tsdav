```ts
export type DAVCalendar = {
  components?: string[];
  timezone?: string;
} & DAVCollection;
```
alias of [DAVCollection](DAVCollection.md) with
- `timezone` iana timezone name of calendar
- `components` array of calendar components defined in [rfc5455](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6)
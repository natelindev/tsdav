```ts
export type DAVCalendar = {
  components?: string[];
  timezone?: string;
  projectedProps?: Record<string, unknown>;
} & DAVCollection;
```

alias of [DAVCollection](DAVCollection.md) with

- `timezone` iana timezone name of calendar
- `components` array of calendar components defined in [rfc5455](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6)
- `projectedProps` object of fetched additional props by passing custom props to [fetchCalendars](../caldav/fetchCalendars.md) function

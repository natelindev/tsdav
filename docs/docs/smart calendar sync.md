---
sidebar_position: 8
---

# Smart calendar sync

Store each calendar's URL, ctag, sync token, supported reports, and object URLs, etags, and original
calendar data. This example uses Basic authentication with a username and application password.
Keep credentials in your application's protected credential storage. An incremental
sync needs the previous object list to distinguish created and updated objects and retain unchanged
objects.

The following adapter keeps database operations explicit. Implement `CalendarStore` with your
existing database; its transaction must commit all object changes and their tokens together.

```ts
import { DAVClient, DAVCalendar, DAVObject, DAVCredentials } from 'tsdav';

interface CalendarTransaction {
  putCalendar(calendar: DAVCalendar): Promise<void>;
  removeCalendar(url: string): Promise<void>;
  putObject(calendarUrl: string, object: DAVObject): Promise<void>;
  removeObject(calendarUrl: string, objectUrl: string): Promise<void>;
}

interface CalendarStore {
  readCalendars(): Promise<DAVCalendar[]>;
  transaction(work: (tx: CalendarTransaction) => Promise<void>): Promise<void>;
}

export async function synchronizeCalendars(
  serverUrl: string,
  credentials: DAVCredentials,
  store: CalendarStore,
) {
  const client = new DAVClient({
    serverUrl,
    credentials,
    defaultAccountType: 'caldav',
  });
  await client.login();
  const local = await store.readCalendars();
  const remote = await client.fetchCalendars();
  const byUrl = new Map(local.map((calendar) => [calendar.url, calendar]));
  const remoteUrls = new Set(remote.map((calendar) => calendar.url));

  const results = await Promise.all(remote.map(async (calendar) => {
    const previous = byUrl.get(calendar.url);
    return client.smartCollectionSyncDetailed({
      collection: {
        ...calendar,
        ctag: previous?.ctag,
        syncToken: previous?.syncToken,
        objects: previous?.objects ?? [],
        objectMultiGet: client.calendarMultiGet,
        fetchObjects: async (params: Parameters<NonNullable<DAVCalendar['fetchObjects']>>[0]) => {
          if (!params) throw new Error('A collection is required');
          const { collection, ...options } = params;
          return client.fetchCalendarObjects({
            ...options,
            calendar: collection,
            filters: { 'comp-filter': { _attributes: { name: 'VCALENDAR' } } },
            urlFilter: (url) => new URL(url, collection.url).href !== collection.url,
          });
        },
      },
    });
  }));

  await store.transaction(async (tx) => {
    for (const calendar of local) {
      if (!remoteUrls.has(calendar.url)) await tx.removeCalendar(calendar.url);
    }
    for (const result of results) {
      const { objects, objectMultiGet, fetchObjects, ...metadata } = result;
      for (const object of [...objects.created, ...objects.updated]) {
        await tx.putObject(result.url, { ...object, url: new URL(object.url, result.url).href });
      }
      for (const object of objects.deleted) {
        await tx.removeObject(result.url, new URL(object.url, result.url).href);
      }
      await tx.putCalendar(metadata);
    }
  });
}
```

Method selection uses the discovered reports: WebDAV sync retrieves changed objects through
`objectMultiGet`; basic sync uses ctag and a complete collection query through `fetchObjects`.
The client's multiget methods are bound and can be used as callbacks. Store the returned token,
which represents the successfully fetched changes. If discovery, sync, fetching, or the database
transaction fails, retain the previous tokens and retry from that state.

For local changes, serialize a complete iCalendar resource and call `createCalendarObject`,
`updateCalendarObject`, or `deleteCalendarObject`. These helpers return a Fetch `Response`; check
`response.ok` before updating local state. A 412 response indicates a precondition conflict and
requires fetching the current remote object before deciding how to reconcile it. Preserve recurrence,
all-day dates, timezones, and exceptions when editing the data; see [feed import](./caldav/import-ical-feed.md).

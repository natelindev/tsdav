---
sidebar_position: 15
---

# Importing iCal feeds

Fetch the subscription feed, parse it with [ical.js](https://github.com/kewisch/ical.js), and upload
one resource per UID. Install `ical.js` alongside `tsdav`. The parser and serializer preserve date
values, escaped text, recurrence rules, and recurrence exceptions. Include the feed's timezone
components in each resource.

```ts
import ICAL from 'ical.js';
import { createCalendarObject, DAVCalendar } from 'tsdav';

export async function importExternalFeed(
  feedUrl: string,
  targetCalendar: DAVCalendar,
  authHeader: string,
) {
  const response = await fetch(feedUrl);
  if (!response.ok) throw new Error(`Feed download failed: ${response.status}`);
  const source = new ICAL.Component(ICAL.parse(await response.text()));
  const byUid = new Map<string, ICAL.Component[]>();
  for (const event of source.getAllSubcomponents('vevent')) {
    const uid = event.getFirstPropertyValue('uid');
    if (typeof uid !== 'string' || !uid) throw new Error('Feed event has no UID');
    const group = byUid.get(uid) ?? [];
    group.push(event);
    byUid.set(uid, group);
  }

  let imported = 0;
  for (const [uid, events] of byUid) {
    const resource = new ICAL.Component(['vcalendar', [], []]);
    resource.addPropertyWithValue('version', '2.0');
    resource.addPropertyWithValue('prodid', '-//tsdav//Feed importer//EN');
    for (const timezone of source.getAllSubcomponents('vtimezone')) {
      resource.addSubcomponent(new ICAL.Component(JSON.parse(JSON.stringify(timezone.toJSON()))));
    }
    for (const event of events) {
      resource.addSubcomponent(new ICAL.Component(JSON.parse(JSON.stringify(event.toJSON()))));
    }
    const result = await createCalendarObject({
      calendar: targetCalendar,
      filename: `feed-${encodeURIComponent(uid)}.ics`,
      iCalString: resource.toString(),
      headers: { authorization: authHeader },
    });
    if (!result.ok) {
      throw new Error(`Import failed for ${uid}: ${result.status}`);
    }
    imported += 1;
  }
  return imported;
}
```

This is an import, not a feed synchronization policy. `createCalendarObject` uses `If-None-Match: *`;
a duplicate resource returns 412 and the example throws. For repeated polling, keep a UID-to-resource
mapping and fetched etags, use `updateCalendarObject` with the current etag for changes, and decide
explicitly whether a removed feed event should be deleted. A later failure can leave earlier uploads
completed, so persist successful imports individually in that workflow.

---
sidebar_position: 15
---

# Importing iCal Feeds (Airbnb, Booking.com, etc.)

`tsdav` is a CalDAV and CardDAV client, which means it is designed to interact with DAV servers. It does not natively support ingesting and syncing iCal subscription feeds (like those provided by Airbnb or Booking.com) directly.

However, you can easily implement this functionality by combining `tsdav` with an iCal parser.

## Recommended Approach

1.  **Fetch the iCal feed**: Use a standard HTTP client (like `fetch` or `axios`) to download the `.ics` file from the source URL.
2.  **Parse the feed**: Use a library like [ical.js](https://github.com/mozilla-comm/ical.js) or [node-ical](https://github.com/peterbraden/node-ical) to parse the iCal data.
3.  **Push to CalDAV**: Iterate through the events in the parsed feed and use `createCalendarObject` to upload them to your target CalDAV calendar.

## Example Integration

Here is a conceptual example of how you might import events from an external iCal URL into a CalDAV calendar using `node-ical` and `tsdav`.

```ts
import ical from 'node-ical';
import { createCalendarObject, DAVCalendar } from 'tsdav';

async function importExternalFeed(
  feedUrl: string,
  targetCalendar: DAVCalendar,
  authHeader: string,
) {
  // 1. Fetch and parse the feed
  const events = await ical.async.fromURL(feedUrl);

  for (const event of Object.values(events)) {
    if (event.type !== 'VEVENT') continue;

    // 2. Convert the event back to an iCal string (if needed) or use the raw source
    // Note: You should wrap each event in its own VCALENDAR/VEVENT structure for CalDAV
    const iCalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//tsdav//Import Helper//EN
BEGIN:VEVENT
UID:${event.uid}
SUMMARY:${event.summary}
DTSTART:${event.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${event.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:${event.description || ''}
END:VEVENT
END:VCALENDAR`;

    // 3. Upload to CalDAV
    try {
      await createCalendarObject({
        calendar: targetCalendar,
        filename: `${event.uid}.ics`,
        iCalString,
        headers: {
          authorization: authHeader,
        },
      });
      console.log(`Imported event: ${event.summary}`);
    } catch (error) {
      // In a real application, you'd handle 412 Precondition Failed (If-None-Match)
      // if the event already exists, or use updateCalendarObject if you want to sync.
      console.error(`Failed to import event ${event.uid}:`, error);
    }
  }
}
```

## Considerations

- **Syncing**: To avoid duplicates, you should track which events have already been imported (e.g., by keeping a map of UIDs).
- **Updates**: If an event changes in the source feed, you should use `updateCalendarObject` instead of `createCalendarObject`.
- **Feed Polling**: You will need to set up your own periodic job (e.g., a cron job or a background worker) to poll the iCal feed and trigger the import process.

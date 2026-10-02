import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const content = `# tsdav Documentation

> TypeScript WebDAV client library wrapping CalDAV and CardDAV workflows for browsers and Node.js.

## Documentation Pages

- [/intro](/intro): Introduction, runtime compatibility, quickstart
- [/cloud-providers](/cloud-providers): Cloud provider setup for Apple, Google, Fastmail, Nextcloud, Zoho
- [/smart-calendar-sync](/smart-calendar-sync): End-to-end sync workflow with database guidance
- [/migration](/migration): Migration from v1 to v2
- [/caldav/fetchcalendars](/caldav/fetchcalendars): CalDAV calendar discovery
- [/caldav/fetchcalendarobjects](/caldav/fetchcalendarobjects): Fetching calendar objects
- [/caldav/createcalendarobject](/caldav/createcalendarobject): Creating calendar objects
- [/caldav/calendarquery](/caldav/calendarquery): Querying calendar events with time-range filters
- [/carddav/fetchaddressbooks](/carddav/fetchaddressbooks): CardDAV address book discovery
- [/carddav/fetchvcards](/carddav/fetchvcards): Fetching vCards
- [/carddav/createvcard](/carddav/createvcard): Creating vCards
- [/webdav/davrequest](/webdav/davrequest): Low-level WebDAV fetch request wrapper
- [/webdav/propfind](/webdav/propfind): PROPFIND metadata retrieval
- [/helper](/helper): Interactive XML/JSON compact converter

## Full Documentation

- [/llms-full.txt](/llms-full.txt): Complete concatenated documentation in plain text
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

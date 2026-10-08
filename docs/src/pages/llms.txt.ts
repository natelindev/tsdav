import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const content = `# tsdav Documentation

> TypeScript WebDAV client library wrapping CalDAV and CardDAV workflows for browsers, Node.js, Cloudflare Workers, Bun, and Deno. Supports Basic, Digest (RFC 7616), and OAuth Bearer authentication.

## Documentation Pages

- [/intro](/intro): Introduction, runtime compatibility, and quickstart
- [/cloud-providers](/cloud-providers): Cloud provider setup and quirks for Apple iCloud, Google Calendar, Fastmail, Nextcloud, and Zoho
- [/smart-calendar-sync](/smart-calendar-sync): End-to-end sync workflow, database schema guidance, and delta tokens
- [/migration](/migration): Migration guide from v1 to v2
- [/caldav/fetchcalendars](/caldav/fetchcalendars): CalDAV calendar collection discovery
- [/caldav/fetchcalendarobjects](/caldav/fetchcalendarobjects): Fetching calendar objects and events
- [/caldav/createcalendarobject](/caldav/createcalendarobject): Creating calendar events via HTTP PUT
- [/caldav/updatecalendarobject](/caldav/updatecalendarobject): Updating calendar events with ETag concurrency
- [/caldav/deletecalendarobject](/caldav/deletecalendarobject): Deleting calendar objects
- [/caldav/calendarquery](/caldav/calendarquery): Querying calendar events with RFC 4791 time-range filters
- [/caldav/calendarmultiget](/caldav/calendarmultiget): Bulk calendar object retrieval via calendar-multiget
- [/caldav/synccalendars](/caldav/synccalendars): Incremental calendar synchronization with CTAGs
- [/carddav/fetchaddressbooks](/carddav/fetchaddressbooks): CardDAV address book discovery
- [/carddav/fetchvcards](/carddav/fetchvcards): Fetching vCard contacts
- [/carddav/createvcard](/carddav/createvcard): Creating vCards
- [/carddav/updatevcard](/carddav/updatevcard): Updating vCards with ETag concurrency
- [/carddav/deletevcard](/carddav/deletevcard): Deleting vCards
- [/webdav/davrequest](/webdav/davrequest): Low-level WebDAV fetch request wrapper with multi-status parsing
- [/webdav/propfind](/webdav/propfind): PROPFIND XML metadata retrieval
- [/webdav/collection/synccollection](/webdav/collection/synccollection): RFC 6578 sync-collection REPORT for delta updates
- [/helpers/authhelpers](/helpers/authhelpers): Authentication helpers for Basic, Bearer, and RFC 7616 Digest auth
- [/helper](/helper): Interactive XML/JSON compact converter playground

## Full Documentation

- [/llms-full.txt](/llms-full.txt): Complete concatenated documentation in plain text
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

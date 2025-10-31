# AGENTS

## Project Snapshot
- `tsdav` is a TypeScript WebDAV client that wraps CalDAV and CardDAV workflows for browsers and Node.js (`docs/docs/intro.md`).
- Core entry points are `createDAVClient` and `DAVClient`; for the class-based API you must call `client.login()` before issuing DAV requests.
- Source lives in `src/`, generated bundles ship from `dist/`, while human-readable references are kept under `docs/docs/`.
- Install dependencies with `pnpm install`; build with `pnpm build`. Jest integration targets expect provider credentials (`package.json` scripts).
- Debug HTTP traffic by setting `DEBUG=tsdav:*` (`README.md`).

## WebDAV Building Blocks
- `serviceDiscovery`, `fetchPrincipalUrl`, and `fetchHomeUrl` locate account roots via `/.well-known/` redirects (`docs/docs/webdav/account`).
- `createAccount` enriches a `DAVAccount` with discovered URLs plus calendars/address books when supplied credentials.
- `davRequest` is the low-level fetch wrapper shared by WebDAV, CalDAV, and CardDAV helpers (`docs/docs/webdav/davRequest.md`).
- Object helpers map to HTTP verbs: `createObject`, `updateObject`, and `deleteObject` issue PUT/PATCH/DELETE with concurrency headers; `propfind` reads WebDAV metadata (`docs/docs/webdav`).

## CalDAV Workflow Highlights
- Enumerate calendars with `fetchCalendars`; filter or retrieve objects via `fetchCalendarObjects`, `calendarMultiGet`, and `calendarQuery` (`docs/docs/caldav`).
- Write data with `createCalendarObject`, `updateCalendarObject`, and `deleteCalendarObject`; the helpers enforce proper `If-Match`/`If-None-Match` usage.
- `syncCalendars` and `smartCollectionSync` surface server-side `sync-token`/`ctag` deltas for incremental syncs.
- `smart calendar sync.md` documents end-to-end two-way sync: recommended database schema, handling created/updated/deleted objects, and when to fall back to multi-get.

## CardDAV Workflow Highlights
- `fetchAddressBooks` discovers address books; `fetchVCards`, `addressBookMultiGet`, and `addressBookQuery` return contact payloads (`docs/docs/carddav`).
- CRUD mirrors CalDAV: `createVCard`, `updateVCard`, and `deleteVCard` manage `.vcf` resources while honoring provider-specific UID behavior.

## Helpers and Types
- `docs/docs/helper.mdx` exposes the XML ⇄ JS converter to assemble ElementCompact request bodies without manual XML string building.
- Typed shapes such as `DAVAccount`, `DAVCalendar`, `DAVCalendarObject`, `DAVAddressBook`, `ElementCompact`, and credential tokens are documented in `docs/docs/types/`.
- Most high-level functions accept `headers`, `headersToExclude`, and `fetchOptions` overrides—ensure custom auth headers align with provider requirements.

## Cloud Provider Notes
- Credential setup differs across providers (Apple app-specific passwords, Google OAuth refresh tokens, Fastmail app passwords) (`docs/docs/cloud providers.md`).
- Expect quirks such as Google renaming objects to UID-based filenames, Zoho preventing duplicate UIDs, and Nextcloud renaming on delete; design agents to normalize URLs before diffing.

## Field Tips for Agents
- Always normalize calendar object URLs using `URL.resolve` when combining parent collection URLs with relative paths (see smart sync example).
- When overriding CalDAV/CardDAV `props`, keep required fields (`supported-calendar-component-set`, `resourcetype`) to prevent server errors.
- Reuse helper predicates (`urlFilter`, `useMultiGet`) for providers that emit non-`.ics` or non-`.vcf` keys.
- Integration tests (`pnpm test:<provider>`) hit live services—guard credentials via environment variables and skip in CI unless configured.

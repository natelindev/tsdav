## v2.2.1

##### bug fixes

- fixed `fetchCalendars` rejecting calendar collections when servers omit or return an empty `supported-calendar-component-set` (Purelymail compatibility)

## v2.2.0

##### features

- first-class support for [Bun](https://bun.sh) and [Deno](https://deno.com) in addition to Node.js (>= 18), modern browsers, and Cloudflare Workers
- added package `exports` map with `browser`, `deno`, `bun`, `worker`, `import`, `require`, and `default` conditions so each runtime picks the correct bundle automatically
- added dedicated Bun and Deno smoke-test jobs to CI to guard both runtimes against regressions
- added Bun and Deno usage guides to the docs

##### breaking changes

- dropped the `cross-fetch` runtime dependency. tsdav now uses the standards-compliant `fetch` exposed by every supported runtime (Node.js >= 18, browsers, Bun, Deno, Cloudflare Workers, Electron). Hosts without a global `fetch` must install a polyfill on `globalThis` before importing tsdav, or pass a custom `fetch` to `createDAVClient` / `DAVClient` / individual request helpers. Node < 18 is no longer supported (already documented in `engines.node`, now enforced at the code level).
- added `exports` field to `package.json`. Deep subpath imports like `import 'tsdav/dist/tsdav.esm.js'` are no longer allowed; use the package root (`import ... from 'tsdav'`) instead.

##### bug fixes

- fixed `syncCalendars` dropping genuinely unchanged calendars from the non-`detailedResult` return; `unchanged` is now selected by matching sync-token/ctag instead of the inverted comparison
- fixed `fetchCalendarUserAddresses` returning `[]` when the server responded with a single `<href>` element instead of an array
- fixed `fetchCalendars` / `fetchAddressBooks` crashing on servers that omit `resourcetype` or return a single `<comp>` element (`Object.keys(undefined)` / bad dereference)
- fixed `fetchHomeUrl` throwing an opaque `TypeError` when the server returned an empty `<calendar-home-set/>` or `<addressbook-home-set/>`; emits a descriptive error instead
- fixed service discovery silently downgrading explicit `https://` redirects to `http://` when the origin was http; schemeless/relative redirects still inherit the endpoint's protocol
- fixed service discovery's `redirect: 'manual'`, `method`, `headers`, and `body` being silently overridable by user-supplied `fetchOptions`
- fixed `davRequest` crashing on non-multistatus XML responses (e.g. CalDAV `<error>` reports) with `Cannot read properties of undefined (reading 'response')`
- fixed `davRequest` merging `Content-Type` case-insensitively so a user-supplied `content-type` no longer coexists with the library's `Content-Type`
- fixed `davRequest`'s per-response `ok` flag: now derived from the parsed HTTP status (RFC 4918 propstat), not from presence of an `<error/>` element (which matched empty error stubs)
- fixed `davRequest` capping the `raw` field on non-XML responses so oversized HTML error pages don't bloat thrown error messages or logs
- fixed `excludeHeaders` comparing header names case-sensitively; HTTP headers are case-insensitive so `Authorization` and `authorization` are now treated as the same entry
- fixed `nativeType` coercing empty strings, whitespace, and leading-zero tokens (e.g. `"0123"`) to numbers, which corrupted sync-tokens, etags, and ctags parsed from XML
- fixed `camelCase` leaking stray separators on consecutive `-`/`_` runs (`foo--bar` now produces `fooBar`)
- fixed `urlEquals` using a brittle bidirectional-`includes` with a length guard; now a strict trim + single-trailing-slash normalization
- fixed `smartCollectionSync` (`basic` mode) wasting a `fetchObjects` call when the collection wasn't dirty; now short-circuits on `isDirty === false`
- fixed `syncCalendars`'s `detailedResult: true` returning the bare `updated` calendar list without the fetched objects; both result shapes now return calendars with objects populated via `smartCollectionSync`
- fixed `createDAVClient` (factory) silently ignoring `fetchOptions`; parameter added and threaded to every sub-helper
- fixed `DAVClient#davRequest` dropping the per-call `fetchOptions` in favor of `this.fetchOptions`
- fixed OAuth flows never persisting refreshed `accessToken` / rotated `refreshToken` / new `expiration` back onto the credentials object, causing repeat refreshes and stale rotating refresh tokens (Google)
- fixed OAuth headers returning `Bearer undefined` when the in-memory `accessToken` was still valid; the existing token is now reused
- fixed `authMethod: 'Custom'` silently authenticating with no headers when `authFunction` was omitted; now throws a clear error

##### security

- stopped logging the base64 basic-auth token and the OAuth access token under `DEBUG=tsdav:*`; debug output now references the username / emits status codes only

##### improvements

- removed several `as any` casts from `DAVClient` / `createDAVClient` so `fetch` and `fetchOptions` are properly typed (`typeof globalThis.fetch` / `RequestInit`)
- `DAVClient#login` now accepts `{ loadCollections, loadObjects }` to pre-populate the default account in one call
- `createAccount` (factory and class) now validates `accountType` at runtime and throws a clear error when both the passed account and `defaultAccountType` are missing it
- `fetchVCards` default `urlFilter` now returns `boolean` instead of the url string
- added `fetch?` to `DAVCollection.objectMultiGet` type so custom transports can be threaded through `smartCollectionSync`
- added docusaurus-plugin-llms for LLM-friendly documentation
- updated docs for LLM discoverability
- fixed Vercel deployment configuration
- fixed markdown integration for docs deployment

## v2.1.8

##### improvements

- fixed [#272](https://github.com/natelindev/tsdav/issues/272) malformed expand request in fetchCalendarObjects
- optimized fetchCalendarObjects to reduce redundant requests when expand is true
- added Bearer auth support for token-based providers (e.g., Nextcloud OIDC)
- added fetch overrides across account, request, and collection helpers for custom transports
- prefer native fetch in Cloudflare Workers to avoid cross-fetch incompatibilities
- collectionQuery now rejects on non-OK responses instead of returning empty arrays
- fetchVCards filters out collection URLs to avoid empty/invalid entries (Radicale-compatible)
- docs updates for iCal feed import, providers, and custom transport guidance

## v2.1.7

##### improvements

- docs: add browser usage example and clarify class-based login
- docs: add Nextcloud connection guidance and Apple password reference

## v2.1.6

##### improvements

- added AGENTS.md
- updated dependencies
- fixed docs build issues

## v2.1.5

##### improvements

- fixed [#251](https://github.com/natelindev/tsdav/issues/251) thanks to @titanism
- logging improvements

## v2.1.4

**features**

- now exports addressBookMultiGet thanks to @lepirlouit

##### improvements

- fixed [#244](https://github.com/natelindev/tsdav/issues/244) cannot read properties of undefined (reading 'comp')
- fixed [#238](https://github.com/natelindev/tsdav/issues/238) which blocked icloud principal calendar fetching.

## v2.1.3

**features**

- new function `fetchCalendarUserAddresses` thanks to @pierreliefauche
- new type `calendarColor` on `DAVCalendar`

##### improvements

- fetch updates, now use polyfill mode
- updated dependencies
- doc update by community

## v2.1.2

**features**
new option `fetchOptions` on all possible functions, allow customizing fetch options

##### improvements

- updated docs
- updated dependencies

## v2.1.1

##### improvements

- fixed [#201](https://github.com/natelindev/tsdav/issues/201) where `client.smartCollectionSync` have incorrect type
- fixed [#200](https://github.com/natelindev/tsdav/issues/200) where `syncCalendars` incorrectly mark calendars as updated due to type mismatch
- updated docs
- updated dependencies
- use pnpm instead of yarn for package manager

## v2.1.0

**potential breaking changes**

- typescript target changed to `es2018` due to named capturing groups errors

## v2.0.10

**improvements**

- fixed [#191](https://github.com/natelindev/tsdav/issues/191) where `authFunction` is not properly assigned in constructor.
- updated deps.

## v2.0.9

**improvements**

- fixed [#181](https://github.com/natelindev/tsdav/issues/181) where a null check is missing.
- fixed doc example, thanks to [#175](https://github.com/natelindev/tsdav/issues/175)
- added docs related to smart calendar syncing [#138](https://github.com/natelindev/tsdav/issues/138)

## v2.0.8

**improvements**
`etag` of `DAVObject` is now optional fixing [#158](https://github.com/natelindev/tsdav/issues/158)

## v2.0.7

**features**
new option `headersToExclude` on all possible functions, allow precise control on request headers, fixing [#166](https://github.com/natelindev/tsdav/issues/166)

**improvements**
updated dependencies

## v2.0.6

**improvements**

updated dependencies, fixing [#159](https://github.com/natelindev/tsdav/issues/159)

## v2.0.5

**features**

DAVClient supports `digest` auth and `custom` auth, please go to `authHelpers` page in docs for more details.

fetchCalendars now supports `projectedProps`, previously customProps passed in will not get projected to fetched result properly.
with this object map you can map your custom prop to fetched result thanks to @m0dch3n

**improvements**

calendarMultiGet will not send `<filter/>` element if custom filters are null or undefined thanks to @jelmer

docs improvement thanks to @MathisFrenais

typescript type improvement thanks to @zomars

## v2.0.4

**features**

- new option `useMultiGet` for `fetchCalendarObjects` and `fetchVCards` which controls the underlying fetching function to
  better support fetching from providers which does not support `multiGet` functions

**improvements**

- improved documentation
- improved typescript types
- updated deps
- added `.mjs`,`.cjs`,`.min.mjs` and `.min.cjs` versions

## v2.0.3

**improvements**

- added support for davical
- fixed a bug related to expand #116
- updated deps

## v2.0.2

**improvements**

- fixed dependency issues #103
- updated deps

## v2.0.1

**improvements**

- Add missing attribute to makeCalendar method #93, Thanks to @nibdo
- updated dependencies

## v2.0.0

**features**

- `etag` param on `updateObject` is now optional, since some caldav servers will throw error if we use `If-Match` headers.

**improvements**

- fixed collection query not handling empty result properly.
- `createObject` requests now send `If-None-Match`: `*` to avoid accidental overwrite.
- `depth` header and others are now able be to overwritten by user specified headers.
- tested with zoho

## v2.0.0-rc.3

- fixed `urlFilter` not really filtering the urls, only filtering on pathname of urls.
- fixed a bug where fetching on empty calendars/addressBooks returning calendar/addressBook itself as result.

## v2.0.0-rc.2

**improvements**

- fixed wrong namespace issue
- fixed a bug where supportedReportSet was using incorrect depth, which resulted more data fetched than needed.
- added tests for supportedReportSet

**docs**

- added doc for freeBusyQuery

## v2.0.0-rc.1

**improvements**

- fixed wrong namespace issue

## v2.0.0-rc.0

**breaking**

- removed `DAVFilter` and `DAVProp`, now all function uses `ElementCompact` as prop and filter directly generated from `xml-js` instead.
- removed related `formatProp`, `formatFilter` and `mergeObjectDupKeyArray` function since they are not needed (These functions were marked as internal so they really shouldn't be causing breaking change).
- removed `DAVNamespaceShorthandMap` and added `DAVNamespaceShort` as a replacement.
- renamed parameter `vCardUrlFilter` of function `fetchVCards` to `urlFilter` for consistent naming.
- collectionQuery now accepts `DAVNamespaceShort` instead of `DAVNamespace`.

**features**

- added `freeBusyQuery` for CALDAV, note this feature is not working with many caldav providers.
- added `expand` for `fetchCalendarObjects` so it can now.
- added `prop` and `filter` overriding feature to functions where overriding is possible.

**improvements**

- now fetchCalendar fetch `calendarColor` by default.

**docs**

- added a helper to convert `xml` between tsdav compatible `js` objects.
- added migration helper to help convert old `DAVProp` and `DAVFilter` into new `ElementCompact`.
- fixed theming issues to create a more consistent light theme.
- added sitemap for docs for better seo.
- archived version 1.x docs.

## v1.1.6

**improvements**

- Added `vCardUrlFilter` to `fetchVCards` to allow vCard Urls to be filtered before fetching
- tested with baikal

## v1.1.5

**improvements**

- fixed import error when using with node
- tested with nextcloud

## v1.1.4

**features**

Added fastmail cloud providers support.

**improvements**

- Fixed a bug which prevents calendar objects from being fetched.
- Fixed a bug which prevents display name of calendars from being fetched.

## v1.1.3

**improvements**

- Fixed esm and browser support problems #19
- Added rollup as bundler to allow CDN support #32
- dist builds are now committed and now comes with four versions:
  - `tsdav.cjs.js` commonjs version which can be used with node 10 or later.
  - `tsdav.esm.js` esm version which can be used in pure esm packages with node 12 or later.
  - `tsdav.js` version which can be used in both browser and node, contains polyfills and with dependencies bundled in, which makes the file size larger.
  - `tsdav.min.js` minified version of `tsdav.js`.

## v1.1.2

**improvements**

- Fixed a bug which prevents from addressBookMultiGet working #18
- Fixed supportedReportSet undefined error
- ctag obtained from isCollectionDirty should now correctly be string instead of number
- updated all dependencies
- tests are now restructured to integration and unit tests, allowing much better extensibility.
- test requests are now mocked, allowing testing the whole stack without external dependencies
- fixed multiple errors in documentation

## v1.1.1

**improvements**

- Fixed spread params for new way of creating dav client, thanks to @molaux
- Ensure service discovery redirect maintains the proper port, thanks to @n8io
- Fixed a time range issue with new time range format

## v1.1.0

**breaking changes**

- `DAVClient` is no longer a type returned by `createDAVClient`, instead it's a class that can be instantiated.
- `timeRange` in `fetchCalendarObjects` is now validated against `ISO_8601` standard and invalid format will throw an error.
- typescript target changed to `es2015`, if you are on `node >= 10` and `browsers that are not IE and have been updated since 2015`, you should be fine. support for `es5` output is not possible with added `esm` support.

**features**

- added a new way to create `DAVClient` by `new DAVClient(...params)`.
- added support for `esm`.

##### improvements

- typescript checks are now with `strict` enabled, which means better types and less bugs.
- added more exports, now all internal functions are exported.
- multiple documentation improvements.

## v1.0.6

Fixed a bug where timeRange filter sometimes might be in the wrong format.

## v1.0.3

Fixed a bug where calendar objects with `http` in its id would cause operations on it to fail.

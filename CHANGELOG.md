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

##### v1.1.3

**improvements**

- Fixed esm and browser support problems #19
- Added rollup as bundler to allow CDN support #32
- dist builds are now committed and now comes with four versions:
  - `tsdav.cjs.js` commonjs version which can be used with node 10 or later.
  - `tsdav.esm.js` esm version which can be used in pure esm packages with node 12 or later.
  - `tsdav.js` version which can be used in both browser and node, contains polyfills and with dependencies bundled in, which makes the file size larger.
  - `tsdav.min.js` minified version of `tsdav.js`.

##### v1.1.2

**improvements**

- Fixed a bug which prevents from addressBookMultiGet working #18
- Fixed supportedReportSet undefined error
- ctag obtained from isCollectionDirty should now correctly be string instead of number
- updated all dependencies
- tests are now restructured to integration and unit tests, allowing much better extensibility.
- test requests are now mocked, allowing testing the whole stack without external dependencies
- fixed multiple errors in documentation

##### v1.1.1

**improvements**

- Fixed spread params for new way of creating dav client, thanks to @molaux
- Ensure service discovery redirect maintains the proper port, thanks to @n8io
- Fixed a time range issue with new time range format

##### v1.1.0

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

##### v1.0.6

Fixed a bug where timeRange filter sometimes might be in the wrong format.

##### v1.0.3

Fixed a bug where calendar objects with `http` in its id would cause operations on it to fail.

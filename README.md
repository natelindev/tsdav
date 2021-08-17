<p align="center">
  <img width="300" height="200" src="https://github.com/llldar/tsDAV/blob/master/docs/static/img/logo.svg">
</p>
<p align="center">
webdav request made easy
</p>

<p align="center">
  <a href="https://bundlephobia.com/result?p=tsdav">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/tsdav?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/tsdav">
    <img alt="Types" src="https://img.shields.io/npm/types/tsdav?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/tsdav">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/tsdav?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://github.com/llldar/tsDAV/blob/master/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/npm/l/tsdav?style=for-the-badge&labelColor=24292e">
  </a>
</p>

### Features

- Easy to use, well documented JSON based WEBDAV API
- Works in both `Browsers` and `Node.js`
- OAuth2 & Basic Auth helpers built-in
- Native typescript, fully linted and well tested
- Supports WEBDAV, CALDAV, CARDDAV
- End to end tested with Apple & Google Cloud.

### Install

```bash
npm install tsdav
```

or

```bash
yarn add tsdav
```

### Quickstart

##### Google CALDAV

```ts
import { createDAVClient } from 'tsdav';

(async () => {
  const googleClient = await createDAVClient({
    serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
    credentials: {
      refreshToken: 'YOUR_REFRESH_TOKEN_WITH_CALDAV_PERMISSION',
    },
    authMethod: 'Oauth',
    defaultAccountType: 'caldav',
  });

  const calendars = await client.fetchCalendars();

  const calendarObjects = await client.fetchCalendarObjects({
    calendar: calendars[0],
  });
})();
```

##### Apple CARDDAV

```ts
import { createDAVClient } from 'tsdav';

(async () => {
  const client = await createDAVClient({
    serverUrl: 'https://contacts.icloud.com',
    credentials: {
      username: 'YOUR_APPLE_ID',
      password: 'YOUR_APP_SPECIFIC_PASSWORD',
    },
    authMethod: 'Basic',
    defaultAccountType: 'carddav',
  });

  const addressBooks = await client.fetchAddressBooks();

  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0],
  });
})();
```

### Documentation

Check out the [Documentation](https://tsdav.vercel.app/)

### License

[MIT](https://github.com/llldar/tsDAV/blob/master/LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fllldar%2FtsDAV.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fllldar%2FtsDAV?ref=badge_large)

### RELEASE NOTES

##### v1.0.5

Fixed a bug where timeRange filter sometimes might be in the wrong format.

##### v1.0.3

Fixed a bug where calendar objects with `http` in its id would cause operations on it to fail.

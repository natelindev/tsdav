<p align="center">
  <img width="300" height="200" src="https://github.com/natelindev/tsdav/blob/master/docs/static/img/logo.svg">
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
  <a aria-label="License" href="https://github.com/natelindev/tsdav/blob/master/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/npm/l/tsdav?style=for-the-badge&labelColor=24292e">
  </a>
</p>

### Features

- Easy to use, well documented JSON based WEBDAV API
- Works in both `Browsers` and `Node.js`
- Supports Both `commonjs` and `esm`
- OAuth2 & basic auth helpers built-in
- Native typescript, fully linted and well tested
- Supports WEBDAV, CALDAV, CARDDAV
- Tested with multiple cloud providers

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
  const client = await createDAVClient({
    serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
    credentials: {
      tokenUrl: 'https://accounts.google.com/o/oauth2/token',
      username: 'YOUR_EMAIL_ADDRESS',
      refreshToken: 'YOUR_REFRESH_TOKEN_WITH_CALDAV_PERMISSION',
      clientId: 'YOUR_CLIENT_ID',
      clientSecret: 'YOUR_CLIENT_SECRET',
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

After `v1.1.0`, you have a new way of creating clients.

##### Google CALDAV

```ts
import { DAVClient } from 'tsdav';

const client = new DAVClient({
  serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
  credentials: {
    tokenUrl: 'https://accounts.google.com/o/oauth2/token',
    username: 'YOUR_EMAIL_ADDRESS',
    refreshToken: 'YOUR_REFRESH_TOKEN_WITH_CALDAV_PERMISSION',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
  },
  authMethod: 'Oauth',
  defaultAccountType: 'caldav',
});

(async () => {
  await client.login();

  const calendars = await client.fetchCalendars();

  const calendarObjects = await client.fetchCalendarObjects({
    calendar: calendars[0],
  });
})();
```

##### Apple CARDDAV

```ts
import { DAVClient } from 'tsdav';

const client = new DAVClient({
  serverUrl: 'https://contacts.icloud.com',
  credentials: {
    username: 'YOUR_APPLE_ID',
    password: 'YOUR_APP_SPECIFIC_PASSWORD',
  },
  authMethod: 'Basic',
  defaultAccountType: 'carddav',
});

(async () => {
  await client.login();

  const addressBooks = await client.fetchAddressBooks();

  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0],
  });
})();
```

### Documentation

Check out the [Documentation](https://tsdav.vercel.app/)

### License

[MIT](https://github.com/natelindev/tsdav/blob/master/LICENSE)

### Changelog

refers to [Changelog](./CHANGELOG.md)

### Debugging

this package uses `debug` package,
add `tsdav:*` to `DEBUG` env variable to enable debug logs

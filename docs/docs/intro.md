---
sidebar_position: 1
---

# Intro

[WEBDAV](https://tools.ietf.org/html/rfc4918), `Web Distributed Authoring and Versioning`, is an extension of the HTTP to allow handling distributed authoring, versioning of various resources.

It's very common to be used for cloud storage(limited support), as well as calendar, contacts information syncing.

### Cloud provider support status

| Provider name | WEBDAV | CALDAV | CARDDAV |
| ------------- | ------ | ------ | ------- |
| Apple    | ✅     | ✅     | ✅      |
| Google  | ✅     | ✅     | ✅      |
| Fastmail      | ✅     | ✅     | ✅      |
| Nextcloud     | ✅     | ✅     | ✅      |
| Baikal        | ✅     | ✅     | ✅      |
| ZOHO          | ✅     | ✅     | ⛔️     |
| DAViCal       | ✅     | ✅     | ⛔️     |
| Forward Email | ⛔️ | ✅ | ⛔️ |

For more information on cloud providers, go to [cloud providers](./cloud%20providers.md) for more information.

### Install

```bash
yarn add tsdav
```

or

```bash
npm install tsdav
```

### Basic usage

#### Import the dependency

```ts
import { createDAVClient } from 'tsdav';
```

or

```ts
import tsdav from 'tsdav';
```

#### Create Client

By creating a client, you can now use all tsdav methods without supplying authentication header or accounts.

However, you can always pass in custom header or account to override the default for each request.

For Google

```ts
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
```

or

```ts
const client = await createDAVClient({
  serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
  credentials: {
    authorizationCode: 'AUTH_CODE_OBTAINED_FROM_OAUTH_CALLBACK',
    tokenUrl: 'https://accounts.google.com/o/oauth2/token',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
  },
  authMethod: 'Oauth',
  defaultAccountType: 'caldav',
});
```

For Apple

```ts
const client = await createDAVClient({
  serverUrl: 'https://caldav.icloud.com',
  credentials: {
    username: 'YOUR_APPLE_ID',
    password: 'YOUR_APP_SPECIFIC_PASSWORD',
  },
  authMethod: 'Basic',
  defaultAccountType: 'caldav',
});
```

After `v1.1.0`, you have a new way of creating clients.

:::info

You need to call `client.login()` with this method before using the functions

:::

For Google

```ts
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
```

For Apple

```ts
const client = new DAVClient({
  serverUrl: 'https://caldav.icloud.com',
  credentials: {
    username: 'YOUR_APPLE_ID',
    password: 'YOUR_APP_SPECIFIC_PASSWORD',
  },
  authMethod: 'Basic',
  defaultAccountType: 'caldav',
});
```

#### Get calendars

```ts
const calendars = await client.fetchCalendars();
```

#### Get calendar objects on calendars

```ts
const calendarObjects = await client.fetchCalendarObjects({
  calendar: myCalendar,
});
```

#### Get specific calendar objects on calendar using urls

```ts
const calendarObjects = await client.fetchCalendarObjects({
  calendar: myCalendar,
  calendarObjectUrls: urlArray,
});
```

##### Get calendars changes from remote

```ts
const { created, updated, deleted } = await client.syncCalendars({
  calendars: myCalendars,
  detailedResult: true,
});
```

#### Get calendar object changes on a calendar from remote

```ts
const { created, updated, deleted } = (
  await client.smartCollectionSync({
    collection: {
      url: localCalendar.url,
      ctag: localCalendar.ctag,
      syncToken: localCalendar.syncToken,
      objects: localCalendarObjects,
      objectMultiGet: client.calendarMultiGet,
    },
    method: 'webdav',
    detailedResult: true,
  })
).objects;
```

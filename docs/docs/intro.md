---
sidebar_position: 1
---

# Intro

[WEBDAV](https://tools.ietf.org/html/rfc4918), `Web Distributed Authoring and Versioning`, is an extension of the HTTP to allow handling distributed authoring, versioning of various resources.

It's very common to be used for cloud storage, as well as calendar, contacts information syncing.

### Prepare credentials from cloud providers

##### Apple

For apple you want to go to [this page](https://support.apple.com/en-us/HT204397) and after following the guide, you will have Apple ID and app-specific password.

##### Google

For google you want to go to Google Cloud Platform/Credentials page, then create a credential that suite your use case. You want `clientId` ,`client secret` and after this. Also you need to enable Google CALDAV/CARDDAV for your project.

Also you need to setup oauth screen, use proper oauth2 grant flow and you might need to get your application verified by google in order to be able to use CALDAV/CARDDAV api. Refer to [this page](https://developers.google.com/identity/protocols/oauth2) for more details.

After the oauth2 offline grant you should be able to obtain oauth2 refresh token.

:::info
Other cloud providers are not currently tested, in theory any cloud with basic auth and oauth2 should work, stay tuned for updates.
:::

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

#### create client

By creating a client, you can now use all tsdav methods without supplying authentication header or accounts.

However, you can always pass in custom header or account to override the default for each request.

For Google

```ts
const client = await createDAVClient({
  serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
  credentials: {
    refreshToken: 'YOUR_REFRESH_TOKEN_WITH_CALDAV_PERMISSION',
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
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_TOKEN',
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

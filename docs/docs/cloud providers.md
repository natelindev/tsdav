---
sidebar_position: 7
---

# Cloud providers

### Prepare credentials

##### Apple

For apple you want to go to [this page](https://support.apple.com/en-us/HT204397) and after following the guide, you will have Apple ID and app-specific password.

##### Google

For google you want to go to Google Cloud Platform/Credentials page, then create a credential that suite your use case. You want `clientId` ,`client secret` and after this. Also you need to enable Google CALDAV/CARDDAV for your project.

Also you need to setup oauth screen, add needed oauth2 scopes (`https://www.googleapis.com/auth/calendar` for CalDAV), use proper oauth2 grant flow and you might need to get your application verified by google in order to be able to use CALDAV/CARDDAV api. Refer to [this page](https://developers.google.com/identity/protocols/oauth2) for more details.

After the oauth2 offline grant you should be able to obtain oauth2 refresh token.

##### Fastmail

Generate an app specific password just like apple, follow [this guide](https://www.fastmail.help/hc/en-us/articles/360058752834) for more information.

##### Nextcloud

Nextcloud supports CalDAV/CardDAV with Basic auth (username + app password) and Bearer auth (OIDC tokens).

- **Basic Auth:** Recommended for most use cases. Use your username and an app-specific password.
- **Bearer Auth:** Supported if Nextcloud is configured with OIDC (e.g., via `user_oidc` app). Use `authMethod: 'Bearer'` and provide your access token in `credentials.accessToken`.

For browser clients, you may need to use a server-side proxy or trusted domain configuration to avoid CORS issues. A common server URL is:

`https://<your-nextcloud-host>/remote.php/dav`

:::info
Other cloud providers not listed are not currently tested, in theory any cloud with basic auth and oauth2 should work, stay tuned for updates.
:::

##### ZOHO

Please follow [official guide](https://help.zoho.com/portal/en/kb/calendar/syncing-other-calendars/articles/setting-up-caldav-sync-in-zoho-calendar#Configuring_CalDAV_sync_between_Zoho_Calendar_and_your_device)

##### Forward Email

Please follow [offical guide](https://forwardemail.net/en/faq#do-you-support-calendars-caldav)

### Caveats

Some cloud providers' APIs are not very standard, they might includes several quirks.

##### Google

1. CALDAV will always use UID inside `ics` file as filename, for example if you created a new event with name `1.ics` but have `abc` as its UID inside, you can only access it using `abc.ics`.
2. CARDDAV will always generate a new UID for your `.vcf` files. For example a file created with name `1.vcf` with UID `abc`, it will have a UID like `1bcde2e` inside the actual created data.
3. Both CALDAV and CARDDAV will add custom data entries inside your `ics` and `vcf` files like new `PRODID`, new `TIMETAMP` and some custom `X-` fields.
4. For CARDDAV, you cannot create a `vcf` file with the same name again even if it's already deleted.

##### ZOHO

1. CALDAV will always use UID inside `ics` file as filename, for example if you created a new event with name `1.ics` but have `abc` as its UID inside, you can only access it using `abc.ics`.
2. Both CALDAV and CARDDAV will add custom data entries inside your `ics` and `vcf` files like new `PRODID`, new `TIMETAMP` and some custom `X-` fields.
3. For CALDAV, you cannot create a `ics` file with the same UUID again even if it's already deleted.

##### NextCloud

1. Object deletion will result in original object be renamed rather than actual deletion. This can cause problems at times.

### Platform Specifics

#### KaiOS (mozSystem)

KaiOS allows making cross-origin requests from privileged apps using `XMLHttpRequest` with `mozSystem: true`. You can use `tsdav` in KaiOS by providing a custom `fetch` implementation that wraps `XMLHttpRequest`.

```typescript
const kaiOSFetch = (url, init) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.open(init.method || 'GET', url);
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        text: () => Promise.resolve(xhr.responseText),
        headers: {
          get: (name) => xhr.getResponseHeader(name),
        },
      });
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(init.body);
  });
};

const client = new DAVClient({
  serverUrl: '...',
  credentials: { ... },
  fetch: kaiOSFetch as any,
});
```

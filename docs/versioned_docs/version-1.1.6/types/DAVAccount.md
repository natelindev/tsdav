```ts
export type DAVAccount = {
  accountType: 'caldav' | 'carddav';
  serverUrl: string;
  credentials?: DAVCredentials;
  rootUrl?: string;
  principalUrl?: string;
  homeUrl?: string;
  calendars?: DAVCalendar[];
  addressBooks?: DAVAddressBook[];
};
```

- `accountType` can be `caldav` or `carddav`
- `serverUrl` server url of the account
- `credentials` [DAVCredentials](DAVCredentials.md)
- `rootUrl` root url of the account
- `principalUrl` principal resource url
- `homeUrl` resource home set url
- `calendars` calendars of the account, will only be populated by [createAccount](../webdav/account/createAccount.md)
- `addressBooks` addressBooks of the account, will only be populated by [createAccount](../webdav/account/createAccount.md)

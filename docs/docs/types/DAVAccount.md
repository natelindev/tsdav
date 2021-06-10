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
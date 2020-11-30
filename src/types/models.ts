export type DAVCollection = {
  data?: any;
  objects?: DAVObject[];
  account?: DAVAccount;
  ctag?: string;
  description?: string;
  displayName?: string;
  reports?: any;
  resourcetype?: any;
  syncToken?: string;
  url?: string;
};

export type DAVObject = {
  data: any;
  etag: string;
  url: string;
};

export type DAVCredentials = {
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationCode?: string;
  redirectUrl?: string;
  tokenUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiration?: number;
  appleId?: string;
  appSpecificPassword?: string;
};

export type DAVAccount = {
  server?: string;
  credentials?: DAVCredentials;
  rootUrl?: string;
  principalUrl?: string;
  homeUrl?: string;
  calendars?: DAVCalendar[];
  addressBooks?: DAVAddressBook[];
  accountType: 'caldav' | 'carddav';
};

export type DAVAddressBook = DAVCollection;

export type DAVVCard = {
  addressBook: DAVAddressBook;
  addressData: any;
} & DAVObject;

export type DAVCalendar = {
  components?: any;
  timezone?: string;
} & DAVCollection;

export type DAVCalendarObject = {
  calendar?: DAVCalendar;
  calendarData?: any;
} & DAVObject;

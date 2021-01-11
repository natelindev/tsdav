export type DAVCollection = {
  objects?: DAVObject[];
  ctag?: string;
  description?: string;
  displayName?: string;
  reports?: any;
  resourcetype?: any;
  syncToken?: string;
  url: string;
  // should only be used for smartCollectionSync
  fetchObjects?:
    | ((
        collection: DAVCalendar,
        options?:
          | {
              headers?:
                | {
                    [key: string]: any;
                  }
                | undefined;
            }
          | undefined
      ) => Promise<DAVCalendarObject[]>)
    | ((
        collection: DAVAddressBook,
        options?:
          | {
              headers?:
                | {
                    [key: string]: any;
                  }
                | undefined;
            }
          | undefined
      ) => Promise<DAVVCard[]>);
};

export type DAVObject = {
  data?: any;
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
};

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

export type DAVVCard = DAVObject;
export type DAVCalendarObject = DAVObject;

export type DAVAddressBook = DAVCollection;
export type DAVCalendar = {
  components?: string[];
  timezone?: string;
} & DAVCollection;

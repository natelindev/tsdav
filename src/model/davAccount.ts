import { DAVCalendar } from './davCalendar';
import { DAVAddressBook } from './davAddressBook';
import { DAVCredentials } from './davCredentials';

export class DAVAccount {
  server?: string;

  credentials?: DAVCredentials;

  rootUrl?: string;

  principalUrl?: string;

  homeUrl?: string;

  calendars?: DAVCalendar[];

  addressBooks?: DAVAddressBook[];

  accountType: 'caldav' | 'carddav';

  constructor(options?: DAVAccount) {
    if (options) {
      this.accountType = options.accountType ?? 'caldav';
      this.server = options.server;
      this.credentials = options.credentials;
      this.rootUrl = options.rootUrl;
      this.principalUrl = options.principalUrl;
      this.homeUrl = options.homeUrl;
      this.calendars = options.calendars;
      this.addressBooks = options.addressBooks;
    }
  }
}

export class Account {
  server: string;

  credentials: string;

  rootUrl: string;

  principalUrl: string;

  homeUrl: string;

  calendars: string;

  addressBooks: string;

  constructor(options: Account) {
    if (options) {
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

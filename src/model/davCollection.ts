import { DAVObject } from './davObject';
import type { DAVAccount } from './davAccount';

export class DAVCollection {
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

  constructor(options?: DAVCollection) {
    if (options) {
      this.data = options.data;
      this.objects = options.objects;
      this.account = options.account;
      this.ctag = options.ctag;
      this.description = options.description;
      this.displayName = options.displayName;
      this.reports = options.reports;
      this.resourcetype = options.resourcetype;
      this.syncToken = options.syncToken;
      this.url = options.url;
    }
  }
}

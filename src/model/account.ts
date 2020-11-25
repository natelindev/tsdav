import getLogger from 'debug';
import url from 'url';
import fetch from 'cross-fetch';
import { propfind } from '../request';
import { DAVNamespace } from '../consts';

const debug = getLogger('tsdav:account');
export class Account {
  server: string;

  credentials: string;

  rootUrl: string;

  principalUrl: string;

  homeUrl: string;

  calendars: string;

  addressBooks: string;

  accountType: 'caldav' | 'carddav';

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

  async serviceDiscovery(options: {
    accountType: 'caldav' | 'carddav';
    loadCollections: boolean;
    loadObjects: boolean;
  }): Promise<string> {
    debug('Service discovery...');
    const endpoint = url.parse(this.server);
    endpoint.protocol = endpoint.protocol || 'http';

    const uri = url.format({
      protocol: endpoint.protocol,
      host: endpoint.host,
      pathname: `/.well-known/${options.accountType}`,
    });

    try {
      const response = await fetch(uri, { method: 'GET', redirect: 'manual' });

      if (response.status >= 300 && response.status < 400) {
        // http redirect.
        const location = response.headers.get('Location');
        if (typeof location === 'string' && location.length) {
          debug(`Service discovery redirected to ${location}`);
          return url.format({
            protocol: endpoint.protocol,
            host: endpoint.host,
            pathname: location,
          });
        }
      }
    } catch (err) {
      debug('Service discovery failed');
    }

    return endpoint.href;
  }

  async fetchPrincipalUrl(): Promise<string> {
    debug(`Fetch principal url from path ${this.rootUrl}`);
    const responses = await propfind(
      this.rootUrl,
      [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
      { depth: '0' }
    );

    debug('!!!!');
    debug(responses);

    return url.resolve(this.rootUrl, '/123');
  }

  async create(options: { loadCollections?: boolean; loadObject?: boolean }): Promise<void> {
    this.rootUrl = await this.serviceDiscovery({});
    this.principalUrl = await this.fetchPrincipalUrl();
    this.homeUrl = await this.fetchHomeUrl();
  }
}

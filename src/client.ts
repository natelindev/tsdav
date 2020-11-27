import { encode } from 'base-64';
import { fetch, Headers } from 'cross-fetch';
import getLogger from 'debug';
import { DAVDepth, DAVFilter, DAVProp } from 'requestTypes';
import url from 'url';

import { DAVNamespace, ICALObjects } from './consts';
import {
  DAVAccount,
  DAVAddressBook,
  DAVCalendar,
  DAVCalendarObject,
  DAVCollection,
  DAVCredentials,
  DAVVCard,
} from './model';
import * as request from './request';
import { fetchOauthTokens, refreshAccessToken, Tokens } from './util/oauthHelper';
import { urlEquals } from './util/urlEquals';

import type { DAVRequest, DAVResponse } from './request';

const debug = getLogger('tsdav:client');
export class DAVClient {
  url: string;

  authHeaders?: Headers;

  credentials?: DAVCredentials;

  constructor(options: { url: string; credentials: DAVCredentials }) {
    this.authHeaders = new Headers();
    if (options) {
      this.url = options.url;
      this.credentials = options.credentials;
    }
  }

  // Authentication
  async basicAuth(credentials: DAVCredentials = this.credentials): Promise<void> {
    debug(
      `Basic auth token generated: ${encode(`${credentials.username}:${credentials.password}`)}`
    );
    this.authHeaders.append(
      'Authorization',
      `Basic ${encode(`${credentials.username}:${credentials.password}`)}`
    );
  }

  async oauth(credentials: DAVCredentials = this.credentials): Promise<void> {
    let tokens: Tokens;
    if (!credentials.refreshToken) {
      // No refresh token, fetch new tokens
      tokens = await fetchOauthTokens(credentials);
    } else if (
      (credentials.refreshToken && !credentials.accessToken) ||
      Date.now() > (credentials.expiration ?? 0)
    ) {
      // have refresh token, but no accessToken, fetch access token only
      // or have both, but accessToken was expired
      tokens = await refreshAccessToken(credentials);
    }
    // now we should have valid access token
    debug(`Oauth tokens fetched: ${tokens}`);
    this.credentials = { ...credentials, ...(await refreshAccessToken(credentials)) };
  }

  logout(): void {
    this.authHeaders = undefined;
  }

  // Raw request
  async raw(
    init: DAVRequest,
    options: { propDetail?: boolean; convertIncoming?: boolean; parseOutgoing?: boolean }
  ): Promise<DAVResponse[]> {
    return request.davRequest(this.url, { headers: this.authHeaders, ...init }, options);
  }

  async rawXML(
    init: DAVRequest,
    options: { propDetail?: boolean; parseOutgoing?: boolean }
  ): Promise<DAVResponse[]> {
    return request.davRequest(
      this.url,
      { headers: this.authHeaders, ...init },
      { ...options, convertIncoming: false }
    );
  }

  async createObject(
    targetUrl: string,
    data: any,
    headers?: { [key: string]: any }
  ): Promise<Response> {
    return request.createObject(targetUrl, data, { ...this.authHeaders, ...headers });
  }

  async updateObject(
    targetUrl: string,
    data: any,
    etag: string,
    headers?: { [key: string]: any }
  ): Promise<Response> {
    return request.updateObject(targetUrl, data, etag, { ...this.authHeaders, ...headers });
  }

  async deleteObject(
    targetUrl: string,
    etag: string,
    headers?: { [key: string]: any }
  ): Promise<Response> {
    return request.deleteObject(targetUrl, etag, { ...this.authHeaders, ...headers });
  }

  // Basic operations
  async propfind(
    propFindUrl: string,
    props: DAVProp[],
    options?: { depth?: DAVDepth }
  ): Promise<DAVResponse[]> {
    return request.propfind(propFindUrl, props, {
      depth: options?.depth,
      headers: this.authHeaders,
    });
  }

  // query
  async calendarQuery(
    targetUrl: string,
    props?: DAVProp[],
    options?: { filters?: DAVFilter[]; timezone?: string; depth?: DAVDepth }
  ): Promise<DAVResponse[]> {
    return request.calendarQuery(targetUrl, props, { ...options, headers: this.authHeaders });
  }

  async addressBookQuery(
    targetUrl: string,
    props?: DAVProp[],
    options?: { filters?: DAVFilter[]; timezone?: string; depth?: DAVDepth }
  ): Promise<DAVResponse[]> {
    return request.addressBookQuery(targetUrl, props, { ...options, headers: this.authHeaders });
  }

  // Collection operations
  async supportedReportSet(collection: DAVCollection): Promise<any> {
    const res = await this.propfind(
      collection.url,
      [{ name: 'supported-report-set', namespace: DAVNamespace.DAV }],
      { depth: '1' }
    );
    return res[0]?.props?.supportedReportSet;
  }

  async isCollectionDirty(collection: DAVCollection): Promise<boolean> {
    if (!collection.ctag) {
      return false;
    }
    const responses = await this.propfind(
      collection.url,
      [{ name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER }],
      {
        depth: '0',
      }
    );

    const res = responses.filter((r) => urlEquals(collection.url, r.href))[0];
    if (!res) {
      throw new Error('Collection does not exist on server');
    }

    return collection.ctag !== res.props.getctag;
  }

  // Collection sync
  async sync<T extends DAVCollection>(collection: T, method: 'basic' | 'webdav'): Promise<T> {
    const syncMethod =
      method ?? collection.reports?.includes('syncCollection') ? 'webdav' : 'basic';
    if (syncMethod === 'webdav') {
      const result = await this.syncCollection(
        collection.url,
        [
          { name: 'getetag', namespace: DAVNamespace.DAV },
          { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
        ],
        { syncLevel: 1, syncToken: collection.syncToken }
      );

      return {
        ...collection,
        objects: collection.objects.map((c) => {
          const found = result.find((r) => urlEquals(r.href, c.url));
          if (found) {
            return { etag: found.props.getetag };
          }
          return c;
        }),
      };
    }
    if (syncMethod === 'basic') {
      const isDirty = await this.isCollectionDirty(collection);
      if (isDirty) {
        return { ...collection, objects: {} };
      }
    }
    return collection;
  }

  async syncCollection(
    syncUrl: string,
    props: DAVProp[],
    options?: {
      depth?: DAVDepth;
      syncLevel?: number;
      syncToken?: string;
    }
  ): Promise<DAVResponse[]> {
    return request.syncCollection(syncUrl, props, {
      headers: this.authHeaders,
      depth: options.depth,
      syncLevel: options.syncLevel,
      syncToken: options.syncToken,
    });
  }

  // Account operations
  async serviceDiscovery(account: DAVAccount): Promise<string> {
    debug('Service discovery...');
    const endpoint = url.parse(account.server);

    const uri = url.format({
      protocol: endpoint.protocol ?? 'http',
      host: endpoint.host,
      pathname: `/.well-known/${account.accountType}`,
    });

    try {
      const response = await fetch(uri, {
        headers: this.authHeaders,
        method: 'GET',
        redirect: 'manual',
      });

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
      debug(`Service discovery failed: ${err.stack}`);
    }

    return endpoint.href;
  }

  async fetchPrincipalUrl(account: DAVAccount): Promise<string> {
    debug(`Fetching principal url from path ${account.rootUrl}`);
    const responses = await this.propfind(
      account.rootUrl,
      [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
      { depth: '0' }
    );
    debug(`Fetched principal url ${responses[0]?.props.currentUserPrincipal.href}`);
    return url.resolve(account.rootUrl, responses[0]?.props.currentUserPrincipal.href);
  }

  async fetchHomeUrl(account: DAVAccount): Promise<string> {
    debug(`Fetch home url from ${account.principalUrl}`);
    const responses = await this.propfind(account.principalUrl, [
      account.accountType === 'caldav'
        ? { name: 'calendar-home-set', namespace: DAVNamespace.CALDAV }
        : { name: 'addressbook-home-set', namespace: DAVNamespace.CARDDAV },
    ]);

    const matched = responses.find((r) => urlEquals(account.principalUrl, r.href));
    return url.resolve(
      account.rootUrl,
      account.accountType === 'caldav'
        ? matched.props.calendarHomeSet
        : matched.props.addressbookHomeSet
    );
  }

  async createAccount(
    account: DAVAccount,
    loadCollections = true,
    loadObjects = false
  ): Promise<DAVAccount> {
    const rootUrl = await this.serviceDiscovery(account);
    const principalUrl = await this.fetchPrincipalUrl({ ...account, rootUrl });
    const homeUrl = await this.fetchHomeUrl({ ...account, rootUrl, principalUrl });
    let calendars: DAVCalendar[];
    let addressBooks: DAVAddressBook[];
    // to load objects you must first load collections
    if (loadCollections || loadObjects) {
      if (account.accountType === 'caldav') {
        calendars = await this.fetchCalendars(account);
      } else if (account.accountType === 'carddav') {
        addressBooks = await this.fetchAddressBooks(account);
      }
    }
    if (loadObjects) {
      if (account.accountType === 'caldav') {
        calendars = await Promise.all(
          calendars.map(async (cal) => ({
            ...cal,
            objects: await this.fetchCalendarObjects(cal),
          }))
        );
      } else if (account.accountType === 'carddav') {
        addressBooks = await Promise.all(
          addressBooks.map(async (addr) => ({
            ...addr,
            objects: await this.fetchVCards(addr),
          }))
        );
      }
    }

    return new DAVAccount({
      ...account,
      rootUrl,
      principalUrl,
      homeUrl,
      calendars,
      addressBooks,
    });
  }

  /**
   *
   * Calendar operations
   *
   */

  async fetchCalendars(account: DAVAccount): Promise<DAVCalendar[]> {
    const res = await this.propfind(
      account.homeUrl,
      [
        { name: 'calendar-description', namespace: DAVNamespace.CALDAV },
        { name: 'calendar-timezone', namespace: DAVNamespace.CALDAV },
        { name: 'displayname', namespace: DAVNamespace.DAV },
        { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
        { name: 'resourcetype', namespace: DAVNamespace.DAV },
        { name: 'supported-calendar-component-set', namespace: DAVNamespace.CALDAV },
        { name: 'sync-token', namespace: DAVNamespace.DAV },
      ],
      { depth: '1' }
    );
    return Promise.all(
      res
        .filter((r) => r.props.resourcetype.includes('calendar'))
        .filter((rc) => {
          // filter out iCal format calendars.
          const components: any[] = rc.props.supportedCalendarComponentSet || [];
          return components.reduce((prev, curr) => {
            return prev || Object.values(ICALObjects).includes(curr);
          }, false);
        })
        .map((rs) => {
          debug(`Found calendar ${rs.props.displayname},
               props: ${JSON.stringify(rs.props)}`);
          return new DAVCalendar({
            data: res,
            account,
            description: rs.props.calendarDescription,
            timezone: rs.props.calendarTimezone,
            url: url.resolve(account.rootUrl, rs.href),
            ctag: rs.props.getctag,
            displayName: rs.props.displayname,
            components: rs.props.supportedCalendarComponentSet,
            resourceType: rs.props.resourcetype,
            syncToken: rs.props.syncToken,
          });
        })
        .map(async (cal) => ({ ...cal, reports: await this.supportedReportSet(cal) }))
    );
  }

  async fetchCalendarObjects(
    calendar: DAVCalendar,
    options?: { filters?: DAVFilter[] }
  ): Promise<DAVCalendarObject[]> {
    debug(`Fetching calendar objects from ${calendar?.url} 
         ${calendar?.account?.credentials?.username}`);
    const filters: DAVFilter[] = options.filters || [
      {
        type: 'comp-filter',
        attributes: { name: 'VCALENDAR' },
        children: [
          {
            type: 'comp-filter',
            attributes: { name: 'VEVENT' },
          },
        ],
      },
    ];

    return (
      await this.calendarQuery(
        calendar.url,
        [
          { name: 'getetag', namespace: DAVNamespace.DAV },
          { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
        ],
        { filters }
      )
    ).map(
      (res) =>
        new DAVCalendarObject({
          data: res,
          calendar,
          url: url.resolve(calendar.account.rootUrl, res.href),
          etag: res.props.getetag,
          calendarData: res.props.calendarData,
        })
    );
  }

  async createCalendarObject(
    calendar: DAVCalendar,
    iCalString: string,
    filename: string
  ): Promise<Response> {
    return this.createObject(url.resolve(calendar.url, filename), iCalString, {
      'content-type': 'text/calendar; charset=utf-8',
    });
  }

  async updateCalendarObject(calendarObject: DAVCalendarObject): Promise<Response> {
    return this.updateObject(calendarObject.url, calendarObject.calendarData, calendarObject.etag, {
      'content-type': 'text/calendar; charset=utf-8',
    });
  }

  async deleteCalendarObject(calendarObject: DAVCalendarObject): Promise<Response> {
    return this.deleteObject(calendarObject.url, calendarObject.etag);
  }

  async syncCaldavAccount(account: DAVAccount): Promise<DAVAccount> {
    const newCalendars = (await this.fetchCalendars(account)).filter((cal) => {
      return account.calendars.every((c) => !urlEquals(c.url, cal.url));
    });
    return new DAVAccount();
  }

  /**
   *
   * AddressBook operations
   *
   */

  async fetchAddressBooks(account: DAVAccount): Promise<DAVAddressBook[]> {
    const res = await this.propfind(
      account.homeUrl,
      [
        { name: 'displayname', namespace: DAVNamespace.DAV },
        { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
        { name: 'resourcetype', namespace: DAVNamespace.DAV },
        { name: 'sync-token', namespace: DAVNamespace.DAV },
      ],
      { depth: '1' }
    );
    return Promise.all(
      res
        .filter((r) => r.props.displayname && r.props.displayname.length)
        .map((rs) => {
          debug(`Found address book named ${rs.props.displayname},
             props: ${JSON.stringify(rs.props)}`);
          return new DAVAddressBook({
            data: rs,
            account,
            url: url.resolve(account.rootUrl, rs.href),
            ctag: rs.props.getctag,
            displayName: rs.props.displayname,
            resourceType: rs.props.resourcetype,
            syncToken: rs.props.syncToken,
          });
        })
        .map(async (addr) => ({ ...addr, reports: await this.supportedReportSet(addr) }))
    );
  }

  async fetchVCards(addressBook: DAVAddressBook): Promise<DAVVCard[]> {
    return (
      await this.addressBookQuery(
        addressBook.url,
        [
          { name: 'getetag', namespace: DAVNamespace.DAV },
          { name: 'address-data', namespace: DAVNamespace.CARDDAV },
        ],
        { depth: '1' }
      )
    ).map((res) => {
      return new DAVVCard({
        data: res,
        addressBook,
        url: url.resolve(addressBook.account.rootUrl, res.href),
        etag: res.props.getetag,
        addressData: res.props.addressData,
      });
    });
  }

  async createVCard(
    addressBook: DAVAddressBook,
    vCardString: string,
    filename: string
  ): Promise<Response> {
    return this.createObject(url.resolve(addressBook.url, filename), vCardString, {
      'content-type': 'text/x-vcard;charset=utf-8',
    });
  }

  async updateVCard(vCard: DAVVCard): Promise<Response> {
    return this.updateObject(vCard.url, vCard.addressData, vCard.etag, {
      'content-type': 'text/calendar; charset=utf-8',
    });
  }

  async deleteVCard(vCard: DAVVCard): Promise<Response> {
    return this.deleteObject(vCard.url, vCard.etag);
  }

  // remote change -> local
  async syncCarddavAccount(account: DAVAccount): Promise<DAVAccount> {
    // find new Address books
    const newAddressBooks = (await this.fetchAddressBooks(account)).filter((addr) =>
      account.addressBooks?.some((a) => urlEquals(a.url, addr.url))
    );
    return new DAVAccount();
  }
}

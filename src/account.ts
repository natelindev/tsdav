import { fetch } from 'cross-fetch';
import getLogger from 'debug';
import { DAVAccount } from 'models';
import URL from 'url';

import { fetchAddressBooks, fetchVCards } from './addressBook';
import { fetchCalendarObjects, fetchCalendars } from './calendar';
import { DAVNamespace } from './consts';
import { propfind } from './request';
import { urlEquals } from './util/requestHelpers';

const debug = getLogger('tsdav:account');

export const serviceDiscovery = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any } }
): Promise<string> => {
  debug('Service discovery...');
  const endpoint = URL.parse(account.serverUrl);

  const uri = URL.format({
    protocol: endpoint.protocol ?? 'http',
    host: endpoint.host,
    pathname: `/.well-known/${account.accountType}`,
  });

  try {
    const response = await fetch(uri, {
      headers: options?.headers,
      method: 'GET',
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      // http redirect.
      const location = response.headers.get('Location');
      if (typeof location === 'string' && location.length) {
        debug(`Service discovery redirected to ${location}`);
        return URL.format({
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
};

export const fetchPrincipalUrl = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any } }
): Promise<string> => {
  if (!account.rootUrl) {
    throw new Error('account must have rootUrl before fetchPrincipalUrl');
  }
  debug(`Fetching principal url from path ${account.rootUrl}`);
  const [response] = await propfind(
    account.rootUrl,
    [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
    { depth: 0, headers: options?.headers }
  );
  if (!response.ok) {
    debug(`Fetch principal url failed: ${response.statusText}`);
  }
  debug(`Fetched principal url ${response.props?.currentUserPrincipal.href}`);
  return URL.resolve(account.rootUrl, response.props?.currentUserPrincipal.href ?? '');
};

export const fetchHomeUrl = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any } }
): Promise<string> => {
  if (!account.principalUrl || !account.rootUrl) {
    throw new Error('account must have rootUrl & principalUrl before fetchHomeUrl');
  }
  debug(`Fetch home url from ${account.principalUrl}`);
  const responses = await propfind(
    account.principalUrl,
    [
      account.accountType === 'caldav'
        ? { name: 'calendar-home-set', namespace: DAVNamespace.CALDAV }
        : { name: 'addressbook-home-set', namespace: DAVNamespace.CARDDAV },
    ],
    { depth: 0, headers: options?.headers }
  );

  const matched = responses.find((r) => urlEquals(account.principalUrl, r.href));
  if (!matched || !matched.ok) {
    throw new Error('cannot find homeUrl');
  }

  const result = URL.resolve(
    account.rootUrl,
    account.accountType === 'caldav'
      ? matched?.props?.calendarHomeSet.href
      : matched?.props?.addressbookHomeSet.href
  );
  debug(`Fetched home url ${result}`);
  return result;
};

export const createAccount = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any }; loadCollections?: boolean; loadObjects?: boolean }
): Promise<DAVAccount> => {
  const { headers, loadCollections = false, loadObjects = false } = options ?? {};
  const newAccount: DAVAccount = { ...account };
  newAccount.rootUrl = await serviceDiscovery(account, { headers });
  newAccount.principalUrl = await fetchPrincipalUrl(newAccount, { headers });
  newAccount.homeUrl = await fetchHomeUrl(newAccount, { headers });
  // to load objects you must first load collections
  if (loadCollections || loadObjects) {
    if (account.accountType === 'caldav') {
      newAccount.calendars = await fetchCalendars({ headers, account: newAccount });
    } else if (account.accountType === 'carddav') {
      newAccount.addressBooks = await fetchAddressBooks({ headers, account: newAccount });
    }
  }
  if (loadObjects) {
    if (account.accountType === 'caldav' && newAccount.calendars) {
      newAccount.calendars = await Promise.all(
        newAccount.calendars.map(async (cal) => ({
          ...cal,
          objects: await fetchCalendarObjects(cal, { headers, account: newAccount }),
        }))
      );
    } else if (account.accountType === 'carddav' && newAccount.addressBooks) {
      newAccount.addressBooks = await Promise.all(
        newAccount.addressBooks.map(async (addr) => ({
          ...addr,
          objects: await fetchVCards(addr, { headers, account: newAccount }),
        }))
      );
    }
  }

  return newAccount;
};

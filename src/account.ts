import { fetch } from 'cross-fetch';
import getLogger from 'debug';

import { fetchAddressBooks, fetchVCards } from './addressBook';
import { fetchCalendarObjects, fetchCalendars } from './calendar';
import { DAVNamespace } from './consts';
import { propfind } from './request';
import { DAVAccount } from './types/models';
import { urlContains } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelper';

const debug = getLogger('tsdav:account');

export const serviceDiscovery = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
}): Promise<string> => {
  debug('Service discovery...');
  const { account, headers } = params;
  const endpoint = new URL(account.serverUrl);

  const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
  uri.protocol = endpoint.protocol ?? 'http';

  try {
    const response = await fetch(uri.href, {
      headers,
      method: 'GET',
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      // http redirect.
      const location = response.headers.get('Location');
      if (typeof location === 'string' && location.length) {
        debug(`Service discovery redirected to ${location}`);
        const serviceURL = new URL(location, endpoint);
        serviceURL.protocol = endpoint.protocol ?? 'http';
        return serviceURL.href;
      }
    }
  } catch (err) {
    debug(`Service discovery failed: ${err.stack}`);
  }

  return endpoint.href;
};

export const fetchPrincipalUrl = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
}): Promise<string> => {
  const { account, headers } = params;
  const requiredFields: Array<'rootUrl'> = ['rootUrl'];
  if (!hasFields(account, requiredFields)) {
    throw new Error(
      `account must have ${findMissingFieldNames(account, requiredFields)} before fetchPrincipalUrl`
    );
  }
  debug(`Fetching principal url from path ${account.rootUrl}`);
  const [response] = await propfind({
    url: account.rootUrl,
    props: [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
    depth: '0',
    headers,
  });
  if (!response.ok) {
    debug(`Fetch principal url failed: ${response.statusText}`);
    if (response.status === 401) {
      throw new Error('Invalid credentials');
    }
  }
  debug(`Fetched principal url ${response.props?.currentUserPrincipal.href}`);
  return new URL(response.props?.currentUserPrincipal.href ?? '', account.rootUrl).href;
};

export const fetchHomeUrl = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
}): Promise<string> => {
  const { account, headers } = params;
  const requiredFields: Array<'principalUrl' | 'rootUrl'> = ['principalUrl', 'rootUrl'];
  if (!hasFields(account, requiredFields)) {
    throw new Error(
      `account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`
    );
  }

  debug(`Fetch home url from ${account.principalUrl}`);
  const responses = await propfind({
    url: account.principalUrl,
    props: [
      account.accountType === 'caldav'
        ? { name: 'calendar-home-set', namespace: DAVNamespace.CALDAV }
        : { name: 'addressbook-home-set', namespace: DAVNamespace.CARDDAV },
    ],
    depth: '0',
    headers,
  });

  const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
  if (!matched || !matched.ok) {
    throw new Error('cannot find homeUrl');
  }

  const result = new URL(
    account.accountType === 'caldav'
      ? matched?.props?.calendarHomeSet.href
      : matched?.props?.addressbookHomeSet.href,
    account.rootUrl
  ).href;
  debug(`Fetched home url ${result}`);
  return result;
};

export const createAccount = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
  loadCollections?: boolean;
  loadObjects?: boolean;
}): Promise<DAVAccount> => {
  const { account, headers, loadCollections = false, loadObjects = false } = params;
  const newAccount: DAVAccount = { ...account };
  newAccount.rootUrl = await serviceDiscovery({ account, headers });
  newAccount.principalUrl = await fetchPrincipalUrl({ account: newAccount, headers });
  newAccount.homeUrl = await fetchHomeUrl({ account: newAccount, headers });
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
          objects: await fetchCalendarObjects({ calendar: cal, headers }),
        }))
      );
    } else if (account.accountType === 'carddav' && newAccount.addressBooks) {
      newAccount.addressBooks = await Promise.all(
        newAccount.addressBooks.map(async (addr) => ({
          ...addr,
          objects: await fetchVCards({ addressBook: addr, headers }),
        }))
      );
    }
  }

  return newAccount;
};

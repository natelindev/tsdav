import getLogger from 'debug';

import { fetchAddressBooks, fetchVCards } from './addressBook';
import { fetchCalendarObjects, fetchCalendars } from './calendar';
import { DAVNamespaceShort } from './consts';
import { propfind } from './request';
import { DAVAccount } from './types/models';
import { fetch } from './util/fetch';
import { excludeHeaders, urlContains } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelpers';

const debug = getLogger('tsdav:account');

const getCandidateRootUrls = (serverUrl: string, discoveredRootUrl: string): string[] => {
  const candidates = [discoveredRootUrl, serverUrl, new URL('/', serverUrl).href];

  return candidates.filter((url, index) => candidates.indexOf(url) === index);
};

export const serviceDiscovery = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<string> => {
  debug('Service discovery...');
  const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride ?? fetch;
  const endpoint = new URL(account.serverUrl);

  const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
  uri.protocol = endpoint.protocol ?? 'http';

  const extractRedirect = (response: Response): string | undefined => {
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (typeof location === 'string' && location.length) {
        debug(`Service discovery redirected to ${location}`);
        const serviceURL = new URL(location, endpoint);

        if (serviceURL.hostname === uri.hostname && uri.port && !serviceURL.port) {
          serviceURL.port = uri.port;
        }

        serviceURL.protocol = endpoint.protocol ?? 'http';
        return serviceURL.href;
      }
    }
    return undefined;
  };

  // Try PROPFIND first (standard method for CalDAV/CardDAV service discovery)
  try {
    const response = await requestFetch(uri.href, {
      headers: {
        ...excludeHeaders(headers, headersToExclude),
        'Content-Type': 'text/xml;charset=UTF-8',
      },
      method: 'PROPFIND',
      body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`,
      redirect: 'manual',
      ...fetchOptions,
    } as any);

    const redirectUrl = extractRedirect(response);
    if (redirectUrl) {
      return redirectUrl;
    }
  } catch (err) {
    debug(`Service discovery PROPFIND failed: ${(err as Error).stack}`);
  }

  // Some servers (e.g. sabre-based like RoundCube) only redirect GET requests
  // at .well-known endpoints, so try GET as a fallback
  try {
    const response = await requestFetch(uri.href, {
      headers: excludeHeaders(headers, headersToExclude),
      method: 'GET',
      redirect: 'manual',
      ...fetchOptions,
    } as any);

    const redirectUrl = extractRedirect(response);
    if (redirectUrl) {
      return redirectUrl;
    }
  } catch (err) {
    debug(`Service discovery GET failed: ${(err as Error).stack}`);
  }

  return endpoint.href;
};

export const fetchPrincipalUrl = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<string> => {
  const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields: Array<'rootUrl'> = ['rootUrl'];
  if (!hasFields(account, requiredFields)) {
    throw new Error(
      `account must have ${findMissingFieldNames(
        account,
        requiredFields,
      )} before fetchPrincipalUrl`,
    );
  }
  debug(`Fetching principal url from path ${account.rootUrl}`);
  const [response] = await propfind({
    url: account.rootUrl,
    props: {
      [`${DAVNamespaceShort.DAV}:current-user-principal`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });
  if (!response.ok) {
    debug(`Fetch principal url failed: ${response.statusText}`);
    if (response.status === 401) {
      throw new Error(`Invalid credentials: PROPFIND ${account.rootUrl} returned 401 Unauthorized`);
    }
    throw new Error('cannot find principalUrl');
  }

  const principalHref = response.props?.currentUserPrincipal?.href;
  if (typeof principalHref !== 'string' || !principalHref.length) {
    debug('Fetch principal url failed: missing current-user-principal href');
    throw new Error('cannot find principalUrl');
  }

  debug(`Fetched principal url ${principalHref}`);
  return new URL(principalHref, account.rootUrl).href;
};

export const fetchHomeUrl = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<string> => {
  const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields: Array<'principalUrl' | 'rootUrl'> = ['principalUrl', 'rootUrl'];
  if (!hasFields(account, requiredFields)) {
    throw new Error(
      `account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`,
    );
  }

  debug(`Fetch home url from ${account.principalUrl}`);
  const responses = await propfind({
    url: account.principalUrl,
    props:
      account.accountType === 'caldav'
        ? { [`${DAVNamespaceShort.CALDAV}:calendar-home-set`]: {} }
        : { [`${DAVNamespaceShort.CARDDAV}:addressbook-home-set`]: {} },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });

  const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
  if (!matched || !matched.ok) {
    debug(
      `Fetch home url failed with status ${matched?.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`,
    );
    throw new Error('cannot find homeUrl');
  }

  const result = new URL(
    account.accountType === 'caldav'
      ? matched?.props?.calendarHomeSet.href
      : matched?.props?.addressbookHomeSet.href,
    account.rootUrl,
  ).href;
  debug(`Fetched home url ${result}`);
  return result;
};

export const createAccount = async (params: {
  account: DAVAccount;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  loadCollections?: boolean;
  loadObjects?: boolean;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVAccount> => {
  const {
    account,
    headers,
    loadCollections = false,
    loadObjects = false,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const newAccount: DAVAccount = { ...account };
  const discoveredRootUrl = account.rootUrl ?? await serviceDiscovery({
    account,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });

  if (account.rootUrl) {
    newAccount.rootUrl = account.rootUrl;
  } else if (account.principalUrl) {
    newAccount.rootUrl = discoveredRootUrl;
  } else {
    let lastPrincipalError: Error | undefined;

    for (const rootUrl of getCandidateRootUrls(account.serverUrl, discoveredRootUrl)) {
      try {
        const principalUrl = await fetchPrincipalUrl({
          account: {
            ...newAccount,
            rootUrl,
          },
          headers: excludeHeaders(headers, headersToExclude),
          fetchOptions,
          fetch: fetchOverride,
        });

        newAccount.rootUrl = rootUrl;
        newAccount.principalUrl = principalUrl;
        break;
      } catch (err) {
        lastPrincipalError = err as Error;
      }
    }

    if (!newAccount.rootUrl || !newAccount.principalUrl) {
      throw lastPrincipalError ?? new Error('cannot find principalUrl');
    }
  }

  newAccount.principalUrl = account.principalUrl ?? newAccount.principalUrl ?? await fetchPrincipalUrl({
    account: newAccount,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });
  newAccount.homeUrl = account.homeUrl ?? await fetchHomeUrl({
    account: newAccount,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });
  // to load objects you must first load collections
  if (loadCollections || loadObjects) {
    if (account.accountType === 'caldav') {
      newAccount.calendars = await fetchCalendars({
        headers: excludeHeaders(headers, headersToExclude),
        account: newAccount,
        fetchOptions,
        fetch: fetchOverride,
      });
    } else if (account.accountType === 'carddav') {
      newAccount.addressBooks = await fetchAddressBooks({
        headers: excludeHeaders(headers, headersToExclude),
        account: newAccount,
        fetchOptions,
        fetch: fetchOverride,
      });
    }
  }
  if (loadObjects) {
    if (account.accountType === 'caldav' && newAccount.calendars) {
      newAccount.calendars = await Promise.all(
        newAccount.calendars.map(async (cal) => ({
          ...cal,
          objects: await fetchCalendarObjects({
            calendar: cal,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions,
            fetch: fetchOverride,
          }),
        })),
      );
    } else if (account.accountType === 'carddav' && newAccount.addressBooks) {
      newAccount.addressBooks = await Promise.all(
        newAccount.addressBooks.map(async (addr) => ({
          ...addr,
          objects: await fetchVCards({
            addressBook: addr,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions,
            fetch: fetchOverride,
          }),
        })),
      );
    }
  }

  return newAccount;
};

import getLogger from 'debug';
import { DAVDepth, DAVFilter, DAVProp, DAVRequest, DAVResponse } from 'DAVTypes';

import {
  DAVAccount,
  DAVAddressBook,
  DAVCalendar,
  DAVCalendarObject,
  DAVCollection,
  DAVCredentials,
  DAVVCard,
} from './types/models';
import {
  davRequest,
  createObject as rawCreateObject,
  updateObject as rawUpdateObject,
  deleteObject as rawDeleteObject,
  propfind as rawPropfind,
} from './request';

import { createAccount as rawCreateAccount } from './account';
import {
  calendarQuery as rawCalendarQuery,
  fetchCalendars as rawFetchCalendars,
  fetchCalendarObjects as rawFetchCalendarObjects,
  createCalendarObject as rawCreateCalendarObject,
  updateCalendarObject as rawUpdateCalendarObject,
  deleteCalendarObject as rawDeleteCalendarObject,
  syncCalDAVAccount as rawSyncCalDAVAccount,
} from './calendar';
import {
  addressBookQuery as rawAddressBookQuery,
  fetchAddressBooks as rawFetchAddressBooks,
  fetchVCards as rawFetchVCards,
  createVCard as rawCreateVCard,
  updateVCard as rawUpdateVCard,
  deleteVCard as rawDeleteVCard,
  syncCardDAVAccount as rawSyncCardDAVAccount,
} from './addressBook';
import {
  syncCollection as rawSyncCollection,
  collectionQuery as rawCollectionQuery,
  supportedReportSet as rawSupportedReportSet,
  isCollectionDirty as rawIsCollectionDirty,
  smartCollectionSync as rawSmartCollectionSync,
} from './collection';
import { appendHeaders, getBasicAuthHeaders, getOauthHeaders } from './util/authHelper';
import { Optional } from './util/typeHelper';

const debug = getLogger('tsdav:client');

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createDAVClient = async (
  serverUrl: string,
  credentials: DAVCredentials,
  authMethod?: 'Basic' | 'Oauth'
) => {
  const authHeaders: { [key: string]: any } =
    // eslint-disable-next-line no-nested-ternary
    authMethod === 'Basic'
      ? getBasicAuthHeaders(credentials)
      : authMethod === 'Oauth'
      ? await (await getOauthHeaders(credentials)).headers
      : {};

  // request
  const raw = async (
    url: string,
    init: DAVRequest,
    options?: { convertIncoming?: boolean; parseOutgoing?: boolean }
  ): Promise<DAVResponse[]> =>
    davRequest(
      url ?? serverUrl,
      { ...init, headers: { ...authHeaders, ...init.headers } },
      options
    );

  const rawXML = async (
    url: string,
    init: DAVRequest,
    options?: { parseOutgoing?: boolean }
  ): Promise<DAVResponse[]> =>
    davRequest(
      url ?? serverUrl,
      { ...init, headers: { ...authHeaders, ...init.headers } },
      { ...options, convertIncoming: false }
    );

  const createObject = async (
    url: string,
    data: any,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawCreateObject(url ?? serverUrl, data, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const updateObject = async (
    url: string,
    data: any,
    etag: string,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawUpdateObject(url ?? serverUrl, data, etag, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const deleteObject = async (
    url: string,
    etag?: string,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawDeleteObject(url ?? serverUrl, etag, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const propfind = async (
    url: string,
    props: DAVProp[],
    options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
  ): Promise<DAVResponse[]> =>
    rawPropfind(url ?? serverUrl, props, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  // account
  const createAccount = async (
    account: Optional<DAVAccount, 'server'>,
    options?: { headers?: { [key: string]: any }; loadCollections: boolean; loadObjects: boolean }
  ): Promise<DAVAccount> =>
    rawCreateAccount(
      { server: serverUrl, ...account },
      {
        ...options,
        headers: { ...authHeaders, ...options?.headers },
      }
    );
  // collection
  const collectionQuery = appendHeaders(authHeaders, rawCollectionQuery);

  const syncCollection = async (
    url: string,
    props: DAVProp[],
    options?: {
      depth?: DAVDepth;
      syncLevel?: number;
      syncToken?: string;
      headers?: { [key: string]: any };
    }
  ): Promise<DAVResponse[]> =>
    rawSyncCollection(url, props, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const supportedReportSet = async (
    collection: DAVCollection,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVResponse> =>
    rawSupportedReportSet(collection, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const isCollectionDirty = async (
    collection: DAVCollection,
    options?: { headers?: { [key: string]: any } }
  ): Promise<boolean> =>
    rawIsCollectionDirty(collection, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const smartCollectionSync = async <T extends DAVCollection>(
    collection: T,
    method: 'basic' | 'webdav',
    options?: { headers?: { [key: string]: any } }
  ): Promise<T> =>
    rawSmartCollectionSync<T>(collection, method, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  // calendar
  const calendarQuery = async (
    url: string,
    props: DAVProp[],
    options?: {
      filters?: DAVFilter[];
      timezone?: string;
      depth?: DAVDepth;
      headers?: { [key: string]: any };
    }
  ): Promise<DAVResponse[]> =>
    rawCalendarQuery(url, props, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const fetchCalendars = async (
    account: DAVAccount,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVCalendar[]> =>
    rawFetchCalendars(account, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const fetchCalendarObjects = async (
    calendar: DAVCalendar,
    options?: { filters?: DAVFilter[]; headers?: { [key: string]: any } }
  ): Promise<DAVCalendarObject[]> =>
    rawFetchCalendarObjects(calendar, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const createCalendarObject = async (
    calendar: DAVCalendar,
    iCalString: string,
    filename: string,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawCreateCalendarObject(calendar, iCalString, filename, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const updateCalendarObject = async (
    calendarObject: DAVCalendarObject,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawUpdateCalendarObject(calendarObject, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const deleteCalendarObject = async (
    calendarObject: DAVCalendarObject,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawDeleteCalendarObject(calendarObject, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const syncCalDAVAccount = async (
    account: DAVAccount,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVAccount> =>
    rawSyncCalDAVAccount(account, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  // addressBook
  const addressBookQuery = async (
    url: string,
    props: DAVProp[],
    options?: {
      filters?: DAVFilter[];
      timezone?: string;
      depth?: DAVDepth;
      headers?: { [key: string]: any };
    }
  ): Promise<DAVResponse[]> =>
    rawAddressBookQuery(url, props, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const fetchAddressBooks = async (
    account: DAVAccount,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVAddressBook[]> =>
    rawFetchAddressBooks(account, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const fetchVCards = async (
    addressBook: DAVAddressBook,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVVCard[]> =>
    rawFetchVCards(addressBook, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const createVCard = async (
    addressBook: DAVAddressBook,
    vCardString: string,
    filename: string,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawCreateVCard(addressBook, vCardString, filename, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const updateVCard = async (
    vCard: DAVVCard,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawUpdateVCard(vCard, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const deleteVCard = async (
    vCard: DAVVCard,
    options?: { headers?: { [key: string]: any } }
  ): Promise<Response> =>
    rawDeleteVCard(vCard, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const syncCardDAVAccount = async (
    account: DAVAccount,
    options?: { headers?: { [key: string]: any } }
  ): Promise<DAVAccount> =>
    rawSyncCardDAVAccount(account, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  return {
    raw,
    rawXML,
    propfind,
    createAccount,
    createObject,
    updateObject,
    deleteObject,
    calendarQuery,
    addressBookQuery,
    collectionQuery,
    syncCollection,
    supportedReportSet,
    isCollectionDirty,
    smartCollectionSync,
    fetchCalendars,
    fetchCalendarObjects,
    createCalendarObject,
    updateCalendarObject,
    deleteCalendarObject,
    syncCalDAVAccount,
    fetchAddressBooks,
    fetchVCards,
    createVCard,
    updateVCard,
    deleteVCard,
    syncCardDAVAccount,
  };
};

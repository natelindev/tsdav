import getLogger from 'debug';

import { createAccount as rawCreateAccount } from './account';
import {
  addressBookMultiGet as rawAddressBookMultiGet,
  addressBookQuery as rawAddressBookQuery,
  createVCard as rawCreateVCard,
  deleteVCard as rawDeleteVCard,
  fetchAddressBooks as rawFetchAddressBooks,
  fetchVCards as rawFetchVCards,
  updateVCard as rawUpdateVCard,
} from './addressBook';
import {
  calendarMultiGet as rawCalendarMultiGet,
  calendarQuery as rawCalendarQuery,
  createCalendarObject as rawCreateCalendarObject,
  deleteCalendarObject as rawDeleteCalendarObject,
  fetchCalendarObjects as rawFetchCalendarObjects,
  fetchCalendars as rawFetchCalendars,
  makeCalendar as rawMakeCalendar,
  syncCalendars as rawSyncCalendars,
  updateCalendarObject as rawUpdateCalendarObject,
} from './calendar';
import {
  collectionQuery as rawCollectionQuery,
  isCollectionDirty as rawIsCollectionDirty,
  makeCollection as rawMakeCollection,
  smartCollectionSync as rawSmartCollectionSync,
  supportedReportSet as rawSupportedReportSet,
  syncCollection as rawSyncCollection,
} from './collection';
import {
  createObject as rawCreateObject,
  davRequest,
  deleteObject as rawDeleteObject,
  propfind as rawPropfind,
  updateObject as rawUpdateObject,
} from './request';
import { DAVDepth, DAVFilter, DAVProp, DAVRequest, DAVResponse } from './types/DAVTypes';
import { SmartCollectionSync, SyncCalendars } from './types/functionsOverloads';
import {
  DAVAccount,
  DAVAddressBook,
  DAVCalendar,
  DAVCalendarObject,
  DAVCollection,
  DAVCredentials,
  DAVObject,
  DAVVCard,
} from './types/models';
import { appendHeaders, getBasicAuthHeaders, getOauthHeaders } from './util/authHelper';
import { Await, Optional } from './util/typeHelper';

const debug = getLogger('tsdav:client');

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createDAVClient = async (
  serverUrl: string,
  credentials: DAVCredentials,
  authMethod?: 'Basic' | 'Oauth',
  defaultAccountType?: DAVAccount['accountType'] | undefined
) => {
  const authHeaders: { [key: string]: any } =
    // eslint-disable-next-line no-nested-ternary
    authMethod === 'Basic'
      ? getBasicAuthHeaders(credentials)
      : authMethod === 'Oauth'
      ? await (await getOauthHeaders(credentials)).headers
      : {};

  const defaultAccount = defaultAccountType
    ? await rawCreateAccount(
        { serverUrl, credentials, accountType: defaultAccountType },
        {
          headers: authHeaders,
        }
      )
    : undefined;

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
    account: Optional<DAVAccount, 'serverUrl'>,
    options?: { headers?: { [key: string]: any }; loadCollections: boolean; loadObjects: boolean }
  ): Promise<DAVAccount> =>
    rawCreateAccount(
      { serverUrl, credentials, ...account },
      {
        ...options,
        headers: { ...authHeaders, ...options?.headers },
      }
    );
  // collection
  const collectionQuery = appendHeaders(authHeaders, rawCollectionQuery);
  const makeCollection = appendHeaders(authHeaders, rawMakeCollection);
  const syncCollection = appendHeaders(authHeaders, rawSyncCollection);

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
  ): Promise<{
    isDirty: boolean;
    newCtag: string;
  }> =>
    rawIsCollectionDirty(collection, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
    });

  const smartCollectionSync: SmartCollectionSync = async <T extends DAVCollection>(
    collection: T,
    method?: 'basic' | 'webdav',
    options?: { headers?: { [key: string]: any }; account?: DAVAccount; detailedResult?: boolean }
  ): Promise<any> =>
    rawSmartCollectionSync<T>(collection, method, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  // calendar
  const calendarQuery = appendHeaders(authHeaders, rawCalendarQuery);

  const calendarMultiGet = appendHeaders(authHeaders, rawCalendarMultiGet);

  const makeCalendar = appendHeaders(authHeaders, rawMakeCalendar);

  const fetchCalendars = async (options?: {
    headers?: { [key: string]: any };
    account?: DAVAccount;
  }): Promise<DAVCalendar[]> =>
    rawFetchCalendars({
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  const fetchCalendarObjects = async (
    calendar: DAVCalendar,
    options?: { filters?: DAVFilter[]; headers?: { [key: string]: any }; account?: DAVAccount }
  ): Promise<DAVCalendarObject[]> =>
    rawFetchCalendarObjects(calendar, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  const createCalendarObject = appendHeaders(authHeaders, rawCreateCalendarObject);

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

  const syncCalendars: SyncCalendars = async (
    oldCalendars: DAVCalendar[],
    options?: {
      headers?: { [key: string]: any };
      account?: DAVAccount;
      detailedResult?: boolean;
    }
  ): Promise<any> =>
    rawSyncCalendars(oldCalendars, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  // addressBook
  const addressBookQuery = appendHeaders(authHeaders, rawAddressBookQuery);

  const addressBookMultiGet = appendHeaders(authHeaders, rawAddressBookMultiGet);

  const fetchAddressBooks = async (options?: {
    headers?: { [key: string]: any };
    account?: DAVAccount;
  }): Promise<DAVAddressBook[]> =>
    rawFetchAddressBooks({
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  const fetchVCards = async (
    addressBook: DAVAddressBook,
    options?: { headers?: { [key: string]: any }; account?: DAVAccount }
  ): Promise<DAVVCard[]> =>
    rawFetchVCards(addressBook, {
      ...options,
      headers: { ...authHeaders, ...options?.headers },
      account: options?.account ?? defaultAccount,
    });

  const createVCard = appendHeaders(authHeaders, rawCreateVCard);

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
    makeCollection,
    calendarMultiGet,
    makeCalendar,
    syncCollection,
    supportedReportSet,
    isCollectionDirty,
    smartCollectionSync,
    fetchCalendars,
    fetchCalendarObjects,
    createCalendarObject,
    updateCalendarObject,
    deleteCalendarObject,
    syncCalendars,
    fetchAddressBooks,
    addressBookMultiGet,
    fetchVCards,
    createVCard,
    updateVCard,
    deleteVCard,
  };
};

export type DAVClient = Await<ReturnType<typeof createDAVClient>>;

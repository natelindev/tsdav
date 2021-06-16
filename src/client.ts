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
import { SmartCollectionSync, SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVCredentials } from './types/models';
import { defaultParam, getBasicAuthHeaders, getOauthHeaders } from './util/authHelper';
import { Await, Optional } from './util/typeHelper';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createDAVClient = async (params: {
  serverUrl: string;
  credentials: DAVCredentials;
  authMethod?: 'Basic' | 'Oauth';
  defaultAccountType?: DAVAccount['accountType'] | undefined;
}) => {
  const { serverUrl, credentials, authMethod, defaultAccountType } = params;
  const authHeaders: Record<string, string> =
    // eslint-disable-next-line no-nested-ternary
    authMethod === 'Basic'
      ? getBasicAuthHeaders(credentials)
      : authMethod === 'Oauth'
      ? (await getOauthHeaders(credentials)).headers
      : {};

  const defaultAccount = defaultAccountType
    ? await rawCreateAccount({
        account: { serverUrl, credentials, accountType: defaultAccountType },
        headers: authHeaders,
      })
    : undefined;

  const createObject = defaultParam(rawCreateObject, {
    url: serverUrl,
    headers: authHeaders,
  });
  const updateObject = defaultParam(rawUpdateObject, { headers: authHeaders, url: serverUrl });
  const deleteObject = defaultParam(rawDeleteObject, { headers: authHeaders, url: serverUrl });

  const propfind = defaultParam(rawPropfind, { headers: authHeaders });

  // account
  const createAccount = async (params0: {
    account: Optional<DAVAccount, 'serverUrl'>;
    headers?: Record<string, string>;
    loadCollections?: boolean;
    loadObjects?: boolean;
  }): Promise<DAVAccount> => {
    const { account, headers, loadCollections, loadObjects } = params0;
    return rawCreateAccount({
      account: { serverUrl, credentials, ...account },
      headers: { ...authHeaders, ...headers },
      loadCollections,
      loadObjects,
    });
  };

  // collection
  const collectionQuery = defaultParam(rawCollectionQuery, { headers: authHeaders });
  const makeCollection = defaultParam(rawMakeCollection, { headers: authHeaders });
  const syncCollection = defaultParam(rawSyncCollection, { headers: authHeaders });

  const supportedReportSet = defaultParam(rawSupportedReportSet, {
    headers: authHeaders,
  });

  const isCollectionDirty = defaultParam(rawIsCollectionDirty, {
    headers: authHeaders,
  });

  const smartCollectionSync = defaultParam(rawSmartCollectionSync, {
    headers: authHeaders,
    account: defaultAccount,
  }) as SmartCollectionSync;

  // calendar
  const calendarQuery = defaultParam(rawCalendarQuery, { headers: authHeaders });
  const calendarMultiGet = defaultParam(rawCalendarMultiGet, { headers: authHeaders });
  const makeCalendar = defaultParam(rawMakeCalendar, { headers: authHeaders });

  const fetchCalendars = defaultParam(rawFetchCalendars, {
    headers: authHeaders,
    account: defaultAccount,
  });

  const fetchCalendarObjects = defaultParam(rawFetchCalendarObjects, {
    headers: authHeaders,
  });

  const createCalendarObject = defaultParam(rawCreateCalendarObject, {
    headers: authHeaders,
  });

  const updateCalendarObject = defaultParam(rawUpdateCalendarObject, {
    headers: authHeaders,
  });

  const deleteCalendarObject = defaultParam(rawDeleteCalendarObject, {
    headers: authHeaders,
  });

  const syncCalendars = defaultParam(rawSyncCalendars, {
    account: defaultAccount,
    headers: authHeaders,
  }) as SyncCalendars;

  // addressBook
  const addressBookQuery = defaultParam(rawAddressBookQuery, { headers: authHeaders });
  const addressBookMultiGet = defaultParam(rawAddressBookMultiGet, { headers: authHeaders });
  const fetchAddressBooks = defaultParam(rawFetchAddressBooks, {
    account: defaultAccount,
    headers: authHeaders,
  });

  const fetchVCards = defaultParam(rawFetchVCards, { headers: authHeaders });
  const createVCard = defaultParam(rawCreateVCard, { headers: authHeaders });
  const updateVCard = defaultParam(rawUpdateVCard, { headers: authHeaders });
  const deleteVCard = defaultParam(rawDeleteVCard, { headers: authHeaders });

  return {
    davRequest,
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

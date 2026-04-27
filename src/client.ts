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
  fetchCalendarUserAddresses as rawFetchCalendarUserAddresses,
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
  davRequest as rawDavRequest,
  deleteObject as rawDeleteObject,
  propfind as rawPropfind,
  updateObject as rawUpdateObject,
} from './request';
import { DAVRequest, DAVResponse } from './types/DAVTypes';
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
import {
  defaultParam,
  getBasicAuthHeaders,
  getOauthHeaders,
  getBearerAuthHeaders,
} from './util/authHelpers';
import { Optional } from './util/typeHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createDAVClient = async (params: {
  serverUrl: string;
  credentials: DAVCredentials;
  authMethod?: 'Basic' | 'Oauth' | 'Digest' | 'Custom' | 'Bearer';
  authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
  defaultAccountType?: DAVAccount['accountType'] | undefined;
  fetchOptions?: RequestInit;
  fetch?: typeof globalThis.fetch;
}) => {
  const {
    serverUrl,
    credentials,
    // Match the class-based DAVClient default so the two entrypoints behave
    // the same when `authMethod` is omitted (`authMethod?` on the type must
    // not throw 'Invalid auth method' at runtime).
    authMethod = 'Basic',
    defaultAccountType,
    authFunction,
    fetchOptions: defaultFetchOptions,
    fetch: fetchOverride,
  } = params;

  let authHeaders: Record<string, string> = {};
  switch (authMethod) {
    case 'Basic':
      authHeaders = getBasicAuthHeaders(credentials);
      break;
    case 'Bearer':
      authHeaders = getBearerAuthHeaders(credentials);
      break;
    case 'Oauth':
      authHeaders = (await getOauthHeaders(credentials, undefined, fetchOverride)).headers;
      break;
    case 'Digest':
      authHeaders = {
        Authorization: `Digest ${credentials.digestString}`,
      };
      break;
    case 'Custom':
      if (!authFunction) {
        throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
      }
      authHeaders = (await authFunction(credentials)) ?? {};
      break;
    default:
      throw new Error('Invalid auth method');
  }

  const defaultAccount = defaultAccountType
    ? await rawCreateAccount({
        account: { serverUrl, credentials, accountType: defaultAccountType },
        headers: authHeaders,
        fetchOptions: defaultFetchOptions,
        fetch: fetchOverride,
      })
    : undefined;

  const davRequest = async (params0: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVResponse[]> => {
    const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
    const { headers, ...restInit } = init;
    return rawDavRequest({
      ...rest,
      init: {
        ...restInit,
        headers: {
          ...authHeaders,
          ...headers,
        },
      },
      fetchOptions: fetchOptions ?? defaultFetchOptions,
      fetch: fetchOverride2 ?? fetchOverride,
    });
  };

  const commonDefaults = {
    headers: authHeaders,
    fetchOptions: defaultFetchOptions,
    fetch: fetchOverride,
  } as const;
  const commonDefaultsWithUrl = { url: serverUrl, ...commonDefaults } as const;
  const commonDefaultsWithAccount = { account: defaultAccount, ...commonDefaults } as const;

  const createObject = defaultParam(rawCreateObject, commonDefaultsWithUrl);
  const updateObject = defaultParam(rawUpdateObject, commonDefaultsWithUrl);
  const deleteObject = defaultParam(rawDeleteObject, commonDefaultsWithUrl);

  const propfind = defaultParam(rawPropfind, commonDefaults);

  // account
  const createAccount = async (params0: {
    account: Optional<DAVAccount, 'serverUrl'>;
    headers?: Record<string, string>;
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVAccount> => {
    const {
      account,
      headers,
      loadCollections,
      loadObjects,
      fetchOptions,
      fetch: fetchOverride2,
    } = params0;
    const merged = { serverUrl, credentials, ...account };
    if (!merged.accountType) {
      throw new Error(
        'createAccount requires an accountType; pass one via `account.accountType` or set `defaultAccountType` on the client.',
      );
    }
    return rawCreateAccount({
      account: merged as DAVAccount,
      headers: { ...authHeaders, ...headers },
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions ?? defaultFetchOptions,
      fetch: fetchOverride2 ?? fetchOverride,
    });
  };

  // collection
  const collectionQuery = defaultParam(rawCollectionQuery, commonDefaults);
  const makeCollection = defaultParam(rawMakeCollection, commonDefaults);
  const syncCollection = defaultParam(rawSyncCollection, commonDefaults);

  const supportedReportSet = defaultParam(rawSupportedReportSet, commonDefaults);

  const isCollectionDirty = defaultParam(rawIsCollectionDirty, commonDefaults);

  const smartCollectionSync = defaultParam(
    rawSmartCollectionSync,
    commonDefaultsWithAccount,
  ) as SmartCollectionSync;

  // calendar
  const calendarQuery = defaultParam(rawCalendarQuery, commonDefaults);
  const calendarMultiGet = defaultParam(rawCalendarMultiGet, commonDefaults);
  const makeCalendar = defaultParam(rawMakeCalendar, commonDefaults);

  const fetchCalendars = defaultParam(rawFetchCalendars, commonDefaultsWithAccount);

  const fetchCalendarUserAddresses = defaultParam(
    rawFetchCalendarUserAddresses,
    commonDefaultsWithAccount,
  );

  const fetchCalendarObjects = defaultParam(rawFetchCalendarObjects, commonDefaults);

  const createCalendarObject = defaultParam(rawCreateCalendarObject, commonDefaults);

  const updateCalendarObject = defaultParam(rawUpdateCalendarObject, commonDefaults);

  const deleteCalendarObject = defaultParam(rawDeleteCalendarObject, commonDefaults);

  const syncCalendars = defaultParam(rawSyncCalendars, commonDefaultsWithAccount) as SyncCalendars;

  // addressBook
  const addressBookQuery = defaultParam(rawAddressBookQuery, commonDefaults);
  const addressBookMultiGet = defaultParam(rawAddressBookMultiGet, commonDefaults);
  const fetchAddressBooks = defaultParam(rawFetchAddressBooks, commonDefaultsWithAccount);

  const fetchVCards = defaultParam(rawFetchVCards, commonDefaults);
  const createVCard = defaultParam(rawCreateVCard, commonDefaults);
  const updateVCard = defaultParam(rawUpdateVCard, commonDefaults);
  const deleteVCard = defaultParam(rawDeleteVCard, commonDefaults);

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
    fetchCalendarUserAddresses,
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

export class DAVClient {
  serverUrl: string;

  credentials: DAVCredentials;

  authMethod: 'Basic' | 'Oauth' | 'Digest' | 'Custom' | 'Bearer';

  accountType: DAVAccount['accountType'];

  authHeaders?: Record<string, string>;

  account?: DAVAccount;

  fetchOptions?: RequestInit;

  fetchOverride?: typeof globalThis.fetch;

  authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;

  constructor(params: {
    serverUrl: string;
    credentials: DAVCredentials;
    authMethod?: 'Basic' | 'Oauth' | 'Digest' | 'Custom' | 'Bearer';
    authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
    defaultAccountType?: DAVAccount['accountType'] | undefined;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }) {
    this.serverUrl = params.serverUrl;
    this.credentials = params.credentials;
    this.authMethod = params.authMethod ?? 'Basic';
    this.accountType = params.defaultAccountType ?? 'caldav';
    this.authFunction = params.authFunction;
    this.fetchOptions = params.fetchOptions ?? {};
    this.fetchOverride = params.fetch;
  }

  async login(options?: { loadCollections?: boolean; loadObjects?: boolean }): Promise<void> {
    switch (this.authMethod) {
      case 'Basic':
        this.authHeaders = getBasicAuthHeaders(this.credentials);
        break;
      case 'Bearer':
        this.authHeaders = getBearerAuthHeaders(this.credentials);
        break;
      case 'Oauth':
        this.authHeaders = (
          await getOauthHeaders(this.credentials, this.fetchOptions, this.fetchOverride)
        ).headers;
        break;
      case 'Digest':
        this.authHeaders = {
          Authorization: `Digest ${this.credentials.digestString}`,
        };
        break;
      case 'Custom':
        if (!this.authFunction) {
          throw new Error(
            "authMethod 'Custom' requires an authFunction to produce request headers",
          );
        }
        this.authHeaders = await this.authFunction(this.credentials);
        break;
      default:
        throw new Error('Invalid auth method');
    }

    this.account = this.accountType
      ? await rawCreateAccount({
          account: {
            serverUrl: this.serverUrl,
            credentials: this.credentials,
            accountType: this.accountType,
          },
          headers: this.authHeaders,
          loadCollections: options?.loadCollections,
          loadObjects: options?.loadObjects,
          fetchOptions: this.fetchOptions,
          fetch: this.fetchOverride,
        })
      : undefined;
  }

  async davRequest(params0: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVResponse[]> {
    const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
    const { headers, ...restInit } = init;
    return rawDavRequest({
      ...rest,
      init: {
        ...restInit,
        headers: {
          ...this.authHeaders,
          ...headers,
        },
      },
      fetchOptions: fetchOptions ?? this.fetchOptions,
      fetch: fetchOverride2 ?? this.fetchOverride,
    });
  }

  async createObject(...params: Parameters<typeof rawCreateObject>): Promise<Response> {
    return defaultParam(rawCreateObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async updateObject(...params: Parameters<typeof rawUpdateObject>): Promise<Response> {
    return defaultParam(rawUpdateObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async deleteObject(...params: Parameters<typeof rawDeleteObject>): Promise<Response> {
    return defaultParam(rawDeleteObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async propfind(...params: Parameters<typeof rawPropfind>): Promise<DAVResponse[]> {
    return defaultParam(rawPropfind, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async createAccount(params0: {
    account: Optional<DAVAccount, 'serverUrl'>;
    headers?: Record<string, string>;
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVAccount> {
    const { account, headers, loadCollections, loadObjects, fetchOptions, fetch } = params0;
    // The `Optional<DAVAccount, 'serverUrl'>` type already enforces
    // `accountType` at the type level. Still, guard at runtime so plain-JS
    // consumers get a clear error rather than an opaque downstream failure.
    const accountType = account.accountType ?? this.accountType;
    if (!accountType) {
      throw new Error(
        'createAccount requires an accountType; pass one via `account.accountType` or configure `defaultAccountType` on the DAVClient.',
      );
    }
    return rawCreateAccount({
      account: {
        serverUrl: this.serverUrl,
        credentials: this.credentials,
        ...account,
        accountType,
      },
      headers: { ...this.authHeaders, ...headers },
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions ?? this.fetchOptions,
      fetch: fetch ?? this.fetchOverride,
    });
  }

  async collectionQuery(...params: Parameters<typeof rawCollectionQuery>): Promise<DAVResponse[]> {
    return defaultParam(rawCollectionQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async makeCollection(...params: Parameters<typeof rawMakeCollection>): Promise<DAVResponse[]> {
    return defaultParam(rawMakeCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async syncCollection(...params: Parameters<typeof rawSyncCollection>): Promise<DAVResponse[]> {
    return defaultParam(rawSyncCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async supportedReportSet(...params: Parameters<typeof rawSupportedReportSet>): Promise<string[]> {
    return defaultParam(rawSupportedReportSet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async isCollectionDirty(...params: Parameters<typeof rawIsCollectionDirty>): Promise<{
    isDirty: boolean;
    newCtag: string;
  }> {
    return defaultParam(rawIsCollectionDirty, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
    detailedResult?: false;
  }): Promise<T>;
  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
    detailedResult: true;
  }): Promise<
    Omit<T, 'objects'> & {
      objects: {
        created: DAVObject[];
        updated: DAVObject[];
        deleted: DAVObject[];
      };
    }
  >;
  async smartCollectionSync(...params: any[]): Promise<any> {
    return (
      defaultParam(rawSmartCollectionSync, {
        headers: this.authHeaders,
        fetchOptions: this.fetchOptions,
        fetch: this.fetchOverride,
        account: this.account,
      }) as SmartCollectionSync
    )(params[0]);
  }

  async calendarQuery(...params: Parameters<typeof rawCalendarQuery>): Promise<DAVResponse[]> {
    return defaultParam(rawCalendarQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async makeCalendar(...params: Parameters<typeof rawMakeCalendar>): Promise<DAVResponse[]> {
    return defaultParam(rawMakeCalendar, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async calendarMultiGet(
    ...params: Parameters<typeof rawCalendarMultiGet>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawCalendarMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async fetchCalendars(...params: Parameters<typeof rawFetchCalendars>): Promise<DAVCalendar[]> {
    return defaultParam(rawFetchCalendars, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params?.[0]);
  }

  async fetchCalendarUserAddresses(
    ...params: Parameters<typeof rawFetchCalendarUserAddresses>
  ): Promise<string[]> {
    return defaultParam(rawFetchCalendarUserAddresses, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params?.[0]);
  }

  async fetchCalendarObjects(
    ...params: Parameters<typeof rawFetchCalendarObjects>
  ): Promise<DAVCalendarObject[]> {
    return defaultParam(rawFetchCalendarObjects, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async createCalendarObject(
    ...params: Parameters<typeof rawCreateCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawCreateCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async updateCalendarObject(
    ...params: Parameters<typeof rawUpdateCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawUpdateCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async deleteCalendarObject(
    ...params: Parameters<typeof rawDeleteCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawDeleteCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async syncCalendars(...params: Parameters<SyncCalendars>): Promise<ReturnType<SyncCalendars>> {
    return (
      defaultParam(rawSyncCalendars, {
        headers: this.authHeaders,
        account: this.account,
        fetchOptions: this.fetchOptions,
        fetch: this.fetchOverride,
      }) as SyncCalendars
    )(params[0]);
  }

  async addressBookQuery(
    ...params: Parameters<typeof rawAddressBookQuery>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawAddressBookQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async addressBookMultiGet(
    ...params: Parameters<typeof rawAddressBookMultiGet>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawAddressBookMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async fetchAddressBooks(
    ...params: Parameters<typeof rawFetchAddressBooks>
  ): Promise<DAVAddressBook[]> {
    return defaultParam(rawFetchAddressBooks, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params?.[0]);
  }

  async fetchVCards(...params: Parameters<typeof rawFetchVCards>): Promise<DAVVCard[]> {
    return defaultParam(rawFetchVCards, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async createVCard(...params: Parameters<typeof rawCreateVCard>): Promise<Response> {
    return defaultParam(rawCreateVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async updateVCard(...params: Parameters<typeof rawUpdateVCard>): Promise<Response> {
    return defaultParam(rawUpdateVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }

  async deleteVCard(...params: Parameters<typeof rawDeleteVCard>): Promise<Response> {
    return defaultParam(rawDeleteVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
    })(params[0]);
  }
}

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
  fetch?: typeof fetch;
}) => {
  const {
    serverUrl,
    credentials,
    authMethod,
    defaultAccountType,
    authFunction,
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
      authHeaders = (await authFunction?.(credentials)) ?? {};
      break;
    default:
      throw new Error('Invalid auth method');
  }

  const defaultAccount = defaultAccountType
    ? await rawCreateAccount({
        account: { serverUrl, credentials, accountType: defaultAccountType },
        headers: authHeaders,
      })
    : undefined;

  const davRequest = async (params0: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetch?: typeof fetch;
  }): Promise<DAVResponse[]> => {
    const { init, fetch: fetchOverride2, ...rest } = params0;
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
      fetch: fetchOverride2 ?? fetchOverride,
    });
  };

  const createObject = defaultParam(rawCreateObject, {
    url: serverUrl,
    headers: authHeaders,
    fetch: fetchOverride,
  });
  const updateObject = defaultParam(rawUpdateObject, {
    headers: authHeaders,
    url: serverUrl,
    fetch: fetchOverride,
  });
  const deleteObject = defaultParam(rawDeleteObject, {
    headers: authHeaders,
    url: serverUrl,
    fetch: fetchOverride,
  });

  const propfind = defaultParam(rawPropfind, { headers: authHeaders, fetch: fetchOverride });

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

  const fetchCalendarUserAddresses = defaultParam(rawFetchCalendarUserAddresses, {
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

  fetchOverride?: typeof fetch;

  authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;

  constructor(params: {
    serverUrl: string;
    credentials: DAVCredentials;
    authMethod?: 'Basic' | 'Oauth' | 'Digest' | 'Custom' | 'Bearer';
    authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
    defaultAccountType?: DAVAccount['accountType'] | undefined;
    fetchOptions?: RequestInit;
    fetch?: typeof fetch;
  }) {
    this.serverUrl = params.serverUrl;
    this.credentials = params.credentials;
    this.authMethod = params.authMethod ?? 'Basic';
    this.accountType = params.defaultAccountType ?? 'caldav';
    this.authFunction = params.authFunction;
    this.fetchOptions = params.fetchOptions ?? {};
    this.fetchOverride = params.fetch;
  }

  async login(): Promise<void> {
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
        this.authHeaders = await this.authFunction?.(this.credentials);
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
          fetchOptions: this.fetchOptions,
          fetch: this.fetchOverride,
        } as any)
      : undefined;
  }

  async davRequest(params0: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetchOptions?: RequestInit;
  }): Promise<DAVResponse[]> {
    const { init, ...rest } = params0;
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
      fetchOptions: this.fetchOptions,
    });
  }

  async createObject(...params: Parameters<typeof rawCreateObject>): Promise<Response> {
    return defaultParam(rawCreateObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async updateObject(...params: Parameters<typeof rawUpdateObject>): Promise<Response> {
    return defaultParam(rawUpdateObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async deleteObject(...params: Parameters<typeof rawDeleteObject>): Promise<Response> {
    return defaultParam(rawDeleteObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async propfind(...params: Parameters<typeof rawPropfind>): Promise<DAVResponse[]> {
    return defaultParam(rawPropfind, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async createAccount(params0: {
    account: Optional<DAVAccount, 'serverUrl'>;
    headers?: Record<string, string>;
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
  }): Promise<DAVAccount> {
    const { account, headers, loadCollections, loadObjects, fetchOptions } = params0;
    return rawCreateAccount({
      account: { serverUrl: this.serverUrl, credentials: this.credentials, ...account },
      headers: { ...this.authHeaders, ...headers },
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions ?? this.fetchOptions,
    });
  }

  async collectionQuery(...params: Parameters<typeof rawCollectionQuery>): Promise<DAVResponse[]> {
    return defaultParam(rawCollectionQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async makeCollection(...params: Parameters<typeof rawMakeCollection>): Promise<DAVResponse[]> {
    return defaultParam(rawMakeCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async syncCollection(...params: Parameters<typeof rawSyncCollection>): Promise<DAVResponse[]> {
    return defaultParam(rawSyncCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async supportedReportSet(...params: Parameters<typeof rawSupportedReportSet>): Promise<string[]> {
    return defaultParam(rawSupportedReportSet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async isCollectionDirty(...params: Parameters<typeof rawIsCollectionDirty>): Promise<{
    isDirty: boolean;
    newCtag: string;
  }> {
    return defaultParam(rawIsCollectionDirty, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    fetchOptions?: RequestInit;
    account?: DAVAccount;
    detailedResult?: false;
  }): Promise<T>;
  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    fetchOptions?: RequestInit;
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
        account: this.account,
      }) as SmartCollectionSync
    )(params[0]);
  }

  async calendarQuery(...params: Parameters<typeof rawCalendarQuery>): Promise<DAVResponse[]> {
    return defaultParam(rawCalendarQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async makeCalendar(...params: Parameters<typeof rawMakeCalendar>): Promise<DAVResponse[]> {
    return defaultParam(rawMakeCalendar, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async calendarMultiGet(
    ...params: Parameters<typeof rawCalendarMultiGet>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawCalendarMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async fetchCalendars(...params: Parameters<typeof rawFetchCalendars>): Promise<DAVCalendar[]> {
    return defaultParam(rawFetchCalendars, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
    })(params?.[0]);
  }

  async fetchCalendarUserAddresses(
    ...params: Parameters<typeof rawFetchCalendarUserAddresses>
  ): Promise<string[]> {
    return defaultParam(rawFetchCalendarUserAddresses, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
    })(params?.[0]);
  }

  async fetchCalendarObjects(
    ...params: Parameters<typeof rawFetchCalendarObjects>
  ): Promise<DAVCalendarObject[]> {
    return defaultParam(rawFetchCalendarObjects, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async createCalendarObject(
    ...params: Parameters<typeof rawCreateCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawCreateCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async updateCalendarObject(
    ...params: Parameters<typeof rawUpdateCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawUpdateCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async deleteCalendarObject(
    ...params: Parameters<typeof rawDeleteCalendarObject>
  ): Promise<Response> {
    return defaultParam(rawDeleteCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async syncCalendars(...params: Parameters<SyncCalendars>): Promise<ReturnType<SyncCalendars>> {
    return (
      defaultParam(rawSyncCalendars, {
        headers: this.authHeaders,
        account: this.account,
        fetchOptions: this.fetchOptions,
      }) as SyncCalendars
    )(params[0]);
  }

  async addressBookQuery(
    ...params: Parameters<typeof rawAddressBookQuery>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawAddressBookQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async addressBookMultiGet(
    ...params: Parameters<typeof rawAddressBookMultiGet>
  ): Promise<DAVResponse[]> {
    return defaultParam(rawAddressBookMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async fetchAddressBooks(
    ...params: Parameters<typeof rawFetchAddressBooks>
  ): Promise<DAVAddressBook[]> {
    return defaultParam(rawFetchAddressBooks, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
    })(params?.[0]);
  }

  async fetchVCards(...params: Parameters<typeof rawFetchVCards>): Promise<DAVVCard[]> {
    return defaultParam(rawFetchVCards, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async createVCard(...params: Parameters<typeof rawCreateVCard>): Promise<Response> {
    return defaultParam(rawCreateVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async updateVCard(...params: Parameters<typeof rawUpdateVCard>): Promise<Response> {
    return defaultParam(rawUpdateVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }

  async deleteVCard(...params: Parameters<typeof rawDeleteVCard>): Promise<Response> {
    return defaultParam(rawDeleteVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
    })(params[0]);
  }
}

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
  syncCalendarsDetailed as rawSyncCalendarsDetailed,
  updateCalendarObject as rawUpdateCalendarObject,
  fetchCalendarUserAddresses as rawFetchCalendarUserAddresses,
  freeBusyQuery as rawFreeBusyQuery,
} from './calendar';
import {
  collectionQuery as rawCollectionQuery,
  isCollectionDirty as rawIsCollectionDirty,
  makeCollection as rawMakeCollection,
  smartCollectionSync as rawSmartCollectionSync,
  smartCollectionSyncDetailed as rawSmartCollectionSyncDetailed,
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
import {
  SmartCollectionSyncDetailedResult,
  SyncCalendars,
  SyncCalendarsDetailed,
  SyncCalendarsDetailedResult,
} from './types/functionsOverloads';
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
  defaultParam,
  getBasicAuthHeaders,
  getOauthHeaders,
  getBearerAuthHeaders,
} from './util/authHelpers';
import { createDigestAuthState, createDigestFetch, DigestAuthState } from './util/digestAuth';
import { Optional } from './util/typeHelpers';
import { mergeHeaders } from './util/requestHelpers';

const resolveAuthHeaders = async (
  client: DAVClient,
  fetchOptions = client.fetchOptions,
  fetchOverride = client.fetchOverride,
): Promise<Record<string, string>> => {
  switch (client.authMethod) {
    case 'Basic':
      return getBasicAuthHeaders(client.credentials);
    case 'Bearer':
      return getBearerAuthHeaders(client.credentials);
    case 'Oauth': {
      const { headers } = await getOauthHeaders(client.credentials, fetchOptions, fetchOverride);
      if (!headers.authorization) {
        throw new Error('OAuth authentication failed: token endpoint returned no access token');
      }
      return headers;
    }
    case 'Digest':
      // A precomputed `digestString` is sent as-is, as before. Otherwise the
      // header is computed per request by `authFetch`.
      return client.credentials.digestString != null
        ? { Authorization: `Digest ${client.credentials.digestString}` }
        : {};
    case 'Custom':
      if (!client.authFunction) {
        throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
      }
      return (await client.authFunction(client.credentials)) ?? {};
    default:
      throw new Error('Invalid auth method');
  }
};

const digestStates = new WeakMap<DAVClient, DigestAuthState>();

/**
 * The `fetch` used for a client's DAV requests. With `authMethod: 'Digest'`
 * and a username/password it adds the Digest handshake. Basic clients get it
 * too, inactive until a server answers with a Digest-only challenge, so users
 * need not know which scheme their server uses. Excluding the `Authorization`
 * header via `headersToExclude` opts out of both.
 */
const authFetch = (
  client: DAVClient,
  fetchOverride = client.fetchOverride,
  headersToExclude?: string[],
): typeof globalThis.fetch | undefined => {
  const digest = client.authMethod === 'Digest' && client.credentials.digestString == null;
  if (
    (!digest && client.authMethod !== 'Basic') ||
    headersToExclude?.some((header) => header.toLowerCase() === 'authorization')
  ) {
    return fetchOverride;
  }
  let state = digestStates.get(client);
  if (!state) {
    state = createDigestAuthState(digest);
    digestStates.set(client, state);
  }
  return createDigestFetch({ credentials: client.credentials, fetch: fetchOverride, state });
};

export const createDAVClient = async (params: ConstructorParameters<typeof DAVClient>[0]) => {
  const client = new DAVClient(params);
  client.authHeaders = await resolveAuthHeaders(client);
  client.account = params.defaultAccountType
    ? await rawCreateAccount({
        account: {
          serverUrl: params.serverUrl,
          credentials: params.credentials,
          accountType: params.defaultAccountType,
        },
        headers: client.authHeaders,
        fetchOptions: client.fetchOptions,
        fetch: authFetch(client),
      })
    : undefined;
  return {
    davRequest: client.davRequest.bind(client),
    propfind: client.propfind.bind(client),
    createAccount: async (...args: Parameters<DAVClient['createAccount']>) => {
      if (!args[0].account.accountType) {
        throw new Error(
          'createAccount requires an accountType; pass one via `account.accountType`.',
        );
      }
      return client.createAccount(...args);
    },
    createObject: client.createObject.bind(client),
    updateObject: client.updateObject.bind(client),
    deleteObject: client.deleteObject.bind(client),
    calendarQuery: client.calendarQuery.bind(client),
    addressBookQuery: client.addressBookQuery.bind(client),
    collectionQuery: client.collectionQuery.bind(client),
    makeCollection: client.makeCollection.bind(client),
    calendarMultiGet: client.calendarMultiGet.bind(client),
    makeCalendar: client.makeCalendar.bind(client),
    freeBusyQuery: client.freeBusyQuery.bind(client),
    syncCollection: client.syncCollection.bind(client),
    supportedReportSet: client.supportedReportSet.bind(client),
    isCollectionDirty: client.isCollectionDirty.bind(client),
    smartCollectionSync: client.smartCollectionSync.bind(client),
    smartCollectionSyncDetailed: client.smartCollectionSyncDetailed.bind(client),
    fetchCalendars: client.fetchCalendars.bind(client),
    fetchCalendarUserAddresses: client.fetchCalendarUserAddresses.bind(client),
    fetchCalendarObjects: client.fetchCalendarObjects.bind(client),
    createCalendarObject: client.createCalendarObject.bind(client),
    updateCalendarObject: client.updateCalendarObject.bind(client),
    deleteCalendarObject: client.deleteCalendarObject.bind(client),
    syncCalendars: client.syncCalendars.bind(client),
    syncCalendarsDetailed: client.syncCalendarsDetailed.bind(client),
    fetchAddressBooks: client.fetchAddressBooks.bind(client),
    addressBookMultiGet: client.addressBookMultiGet.bind(client),
    fetchVCards: client.fetchVCards.bind(client),
    createVCard: client.createVCard.bind(client),
    updateVCard: client.updateVCard.bind(client),
    deleteVCard: client.deleteVCard.bind(client),
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
    this.calendarMultiGet = this.calendarMultiGet.bind(this);
    this.addressBookMultiGet = this.addressBookMultiGet.bind(this);
  }

  private authentication?: Promise<void>;

  private async authenticate(
    force = false,
    fetchOptions = this.fetchOptions,
    fetchOverride = this.fetchOverride,
  ): Promise<void> {
    if (!force && this.authMethod !== 'Oauth') return;
    if (
      !force &&
      this.authHeaders &&
      this.credentials.accessToken &&
      (this.credentials.expiration == null || Date.now() < this.credentials.expiration)
    ) {
      this.authHeaders = { authorization: `Bearer ${this.credentials.accessToken}` };
      return;
    }
    if (this.authentication) return this.authentication;
    const authenticate = async (): Promise<void> => {
      this.authHeaders = await resolveAuthHeaders(this, fetchOptions, fetchOverride);
    };
    this.authentication = authenticate();
    try {
      await this.authentication;
    } finally {
      this.authentication = undefined;
    }
  }

  private async requestDefaults(params?: {
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }) {
    await this.authenticate(
      false,
      params?.fetchOptions ?? this.fetchOptions,
      params?.fetch ?? this.fetchOverride,
    );
    return {
      url: this.serverUrl,
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: authFetch(this, params?.fetch, params?.headersToExclude),
    };
  }

  private async invoke<F extends (...args: any[]) => any>(
    fn: F,
    params: Parameters<F>[0],
  ): Promise<Awaited<ReturnType<F>>> {
    const defaults = await this.requestDefaults(params);
    // `defaults.fetch` already wraps a per-call `fetch` override with auth.
    const callParams = params ? { ...params, fetch: defaults.fetch } : params;
    return await defaultParam(
      fn,
      defaults as Partial<Parameters<F>[0]>,
    )(...([callParams] as Parameters<F>));
  }

  async login(options?: { loadCollections?: boolean; loadObjects?: boolean }): Promise<void> {
    await this.authenticate(true);

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
          fetch: authFetch(this),
        })
      : undefined;
  }

  async davRequest(params0: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVResponse[]> {
    const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
    const { headers, ...restInit } = init;
    const defaults = await this.requestDefaults(params0);
    return rawDavRequest({
      ...rest,
      init: {
        ...restInit,
        headers: mergeHeaders(defaults.headers, headers),
      },
      fetchOptions: fetchOptions ?? this.fetchOptions,
      fetch: authFetch(this, fetchOverride2, params0.headersToExclude),
    });
  }

  async createObject(...params: Parameters<typeof rawCreateObject>): Promise<Response> {
    return this.invoke(rawCreateObject, params[0]);
  }

  async updateObject(...params: Parameters<typeof rawUpdateObject>): Promise<Response> {
    return this.invoke(rawUpdateObject, params[0]);
  }

  async deleteObject(...params: Parameters<typeof rawDeleteObject>): Promise<Response> {
    return this.invoke(rawDeleteObject, params[0]);
  }

  async propfind(...params: Parameters<typeof rawPropfind>): Promise<DAVResponse[]> {
    return this.invoke(rawPropfind, params[0]);
  }

  async createAccount(params0: {
    account: Optional<DAVAccount, 'serverUrl'>;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
  }): Promise<DAVAccount> {
    const {
      account,
      headers,
      headersToExclude,
      loadCollections,
      loadObjects,
      fetchOptions,
      fetch,
    } = params0;
    const defaults = await this.requestDefaults(params0);
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
      headers: mergeHeaders(defaults.headers, headers),
      headersToExclude,
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions ?? this.fetchOptions,
      fetch: authFetch(this, fetch, headersToExclude),
    });
  }

  async collectionQuery(...params: Parameters<typeof rawCollectionQuery>): Promise<DAVResponse[]> {
    return this.invoke(rawCollectionQuery, params[0]);
  }

  async makeCollection(...params: Parameters<typeof rawMakeCollection>): Promise<DAVResponse[]> {
    return this.invoke(rawMakeCollection, params[0]);
  }

  async syncCollection(...params: Parameters<typeof rawSyncCollection>): Promise<DAVResponse[]> {
    return this.invoke(rawSyncCollection, params[0]);
  }

  async supportedReportSet(...params: Parameters<typeof rawSupportedReportSet>): Promise<string[]> {
    return this.invoke(rawSupportedReportSet, params[0]);
  }

  async isCollectionDirty(...params: Parameters<typeof rawIsCollectionDirty>): Promise<{
    isDirty: boolean;
    newCtag: string | undefined;
  }> {
    return this.invoke(rawIsCollectionDirty, params[0]);
  }

  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
    /** @deprecated Use smartCollectionSyncDetailed instead. */
    detailedResult?: false;
  }): Promise<T>;
  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
    /** @deprecated Use smartCollectionSyncDetailed instead. */
    detailedResult: true;
  }): Promise<SmartCollectionSyncDetailedResult<T>>;
  async smartCollectionSync<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
    /** @deprecated Use smartCollectionSyncDetailed instead. */
    detailedResult?: boolean;
  }): Promise<T | SmartCollectionSyncDetailedResult<T>>;
  async smartCollectionSync(...params: any[]): Promise<any> {
    return this.invoke(rawSmartCollectionSync, params[0]);
  }

  async smartCollectionSyncDetailed<T extends DAVCollection>(param: {
    collection: T;
    method?: 'basic' | 'webdav';
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof globalThis.fetch;
    account?: DAVAccount;
  }): Promise<SmartCollectionSyncDetailedResult<T>> {
    return this.invoke(rawSmartCollectionSyncDetailed, param) as Promise<
      SmartCollectionSyncDetailedResult<T>
    >;
  }

  async calendarQuery(...params: Parameters<typeof rawCalendarQuery>): Promise<DAVResponse[]> {
    return this.invoke(rawCalendarQuery, params[0]);
  }

  async makeCalendar(...params: Parameters<typeof rawMakeCalendar>): Promise<DAVResponse[]> {
    return this.invoke(rawMakeCalendar, params[0]);
  }

  async freeBusyQuery(...params: Parameters<typeof rawFreeBusyQuery>): Promise<DAVResponse> {
    return this.invoke(rawFreeBusyQuery, params[0]);
  }

  async calendarMultiGet(
    ...params: Parameters<typeof rawCalendarMultiGet>
  ): Promise<DAVResponse[]> {
    return this.invoke(rawCalendarMultiGet, params[0]);
  }

  async fetchCalendars(...params: Parameters<typeof rawFetchCalendars>): Promise<DAVCalendar[]> {
    return this.invoke(rawFetchCalendars, params[0]);
  }

  async fetchCalendarUserAddresses(
    ...params: Parameters<typeof rawFetchCalendarUserAddresses>
  ): Promise<string[]> {
    return this.invoke(rawFetchCalendarUserAddresses, params[0]);
  }

  async fetchCalendarObjects(
    ...params: Parameters<typeof rawFetchCalendarObjects>
  ): Promise<DAVCalendarObject[]> {
    return this.invoke(rawFetchCalendarObjects, params[0]);
  }

  async createCalendarObject(
    ...params: Parameters<typeof rawCreateCalendarObject>
  ): Promise<Response> {
    return this.invoke(rawCreateCalendarObject, params[0]);
  }

  async updateCalendarObject(
    ...params: Parameters<typeof rawUpdateCalendarObject>
  ): Promise<Response> {
    return this.invoke(rawUpdateCalendarObject, params[0]);
  }

  async deleteCalendarObject(
    ...params: Parameters<typeof rawDeleteCalendarObject>
  ): Promise<Response> {
    return this.invoke(rawDeleteCalendarObject, params[0]);
  }

  async syncCalendars(
    params: Parameters<SyncCalendars>[0] & { detailedResult: true },
  ): Promise<SyncCalendarsDetailedResult>;
  async syncCalendars(
    params: Parameters<SyncCalendars>[0] & { detailedResult?: false },
  ): Promise<DAVCalendar[]>;
  async syncCalendars(
    params: Parameters<SyncCalendars>[0],
  ): Promise<DAVCalendar[] | SyncCalendarsDetailedResult>;
  async syncCalendars(
    ...params: Parameters<SyncCalendars>
  ): Promise<DAVCalendar[] | SyncCalendarsDetailedResult> {
    return this.invoke(rawSyncCalendars, params[0]);
  }

  async syncCalendarsDetailed(
    ...params: Parameters<SyncCalendarsDetailed>
  ): Promise<SyncCalendarsDetailedResult> {
    return this.invoke(rawSyncCalendarsDetailed, params[0]);
  }

  async addressBookQuery(
    ...params: Parameters<typeof rawAddressBookQuery>
  ): Promise<DAVResponse[]> {
    return this.invoke(rawAddressBookQuery, params[0]);
  }

  async addressBookMultiGet(
    ...params: Parameters<typeof rawAddressBookMultiGet>
  ): Promise<DAVResponse[]> {
    return this.invoke(rawAddressBookMultiGet, params[0]);
  }

  async fetchAddressBooks(
    ...params: Parameters<typeof rawFetchAddressBooks>
  ): Promise<DAVAddressBook[]> {
    return this.invoke(rawFetchAddressBooks, params[0]);
  }

  async fetchVCards(...params: Parameters<typeof rawFetchVCards>): Promise<DAVVCard[]> {
    return this.invoke(rawFetchVCards, params[0]);
  }

  async createVCard(...params: Parameters<typeof rawCreateVCard>): Promise<Response> {
    return this.invoke(rawCreateVCard, params[0]);
  }

  async updateVCard(...params: Parameters<typeof rawUpdateVCard>): Promise<Response> {
    return this.invoke(rawUpdateVCard, params[0]);
  }

  async deleteVCard(...params: Parameters<typeof rawDeleteVCard>): Promise<Response> {
    return this.invoke(rawDeleteVCard, params[0]);
  }
}

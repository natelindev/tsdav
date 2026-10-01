/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';
import { ElementCompact } from 'xml-js';

import { DAVNamespace, DAVNamespaceShort } from './consts';
import { davRequest, propfind } from './request';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import {
  SmartCollectionSync,
  SmartCollectionSyncDetailed,
  SmartCollectionSyncDetailedResult,
} from './types/functionsOverloads';
import { DAVAccount, DAVCollection, DAVObject } from './types/models';
import {
  cleanupFalsy,
  excludeHeaders,
  getDAVAttribute,
  urlMatches,
  ensureTrailingSlash,
} from './util/requestHelpers';
import { diffDAVObjects, getDAVUrlKey } from './util/syncHelpers';
import { assertDAVObjectResponses, getDAVText } from './util/responseHelpers';
import {
  findMissingFieldNames,
  hasFields,
  hasOwn,
  RequireAndNotNullSome,
} from './util/typeHelpers';

const debug = getLogger('tsdav:collection');

const resolveDAVHref = (href: string, baseUrl: string): string => {
  try {
    return new URL(href, ensureTrailingSlash(baseUrl)).href;
  } catch {
    return href;
  }
};

export const collectionQuery = async (params: {
  url: string;
  body: any;
  depth?: DAVDepth;
  defaultNamespace?: DAVNamespaceShort;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    body,
    depth,
    defaultNamespace = DAVNamespaceShort.DAV,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const queryResults = await davRequest({
    url,
    init: {
      method: 'REPORT',
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: defaultNamespace,
      body,
    },
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });

  // RFC 4791 §7.8: an empty calendar-query is HTTP 207 with an empty
  // <D:multistatus/>. Some servers instead return a single collection-level
  // 404 with no propstat ("No resources found"). Restrict this compatibility
  // workaround to calendar queries and the queried collection. HTTP-level errors keep
  // `raw` as a string; parsed 207 members set `raw` to the xml-js tree.
  const emptyNotFound = queryResults[0];
  if (
    defaultNamespace === DAVNamespaceShort.CALDAV &&
    body?.['calendar-query'] != null &&
    queryResults.length === 1 &&
    emptyNotFound &&
    emptyNotFound.status === 404 &&
    urlMatches(url, emptyNotFound.href, url) &&
    !emptyNotFound.error &&
    Object.keys(emptyNotFound.props ?? {}).length === 0 &&
    typeof emptyNotFound.raw === 'object' &&
    emptyNotFound.raw !== null &&
    emptyNotFound.raw.multistatus?.response?.propstat == null
  ) {
    return [];
  }

  const errorResponse = queryResults.find((res) => !res.ok || (res.status && res.status >= 400));
  if (errorResponse) {
    throw new Error(
      `Collection query failed: ${errorResponse.status} ${errorResponse.statusText}. ${
        typeof errorResponse.raw === 'string'
          ? `Raw response: ${errorResponse.raw.slice(0, 4096)}`
          : ''
      }`,
    );
  }

  if (
    (body?.['calendar-query'] ||
      body?.['calendar-multiget'] ||
      body?.['addressbook-query'] ||
      body?.['addressbook-multiget']) &&
    queryResults.some((response) => !response.raw?.multistatus)
  ) {
    throw new Error('Collection query failed: expected a DAV multistatus response');
  }
  if (
    (body?.['calendar-query'] ||
      body?.['calendar-multiget'] ||
      body?.['addressbook-query'] ||
      body?.['addressbook-multiget']) &&
    queryResults.some(
      (response) =>
        response.raw?.multistatus?.response &&
        (typeof response.href !== 'string' || !response.href),
    )
  ) {
    throw new Error('Collection query failed: missing href in DAV response');
  }
  const firstQueryResult = queryResults[0];
  // empty query result
  if (
    queryResults.length === 1 &&
    firstQueryResult &&
    (!firstQueryResult.raw ||
      (firstQueryResult.raw.multistatus && !firstQueryResult.raw.multistatus.response)) &&
    firstQueryResult.status &&
    firstQueryResult.status < 300
  ) {
    return [];
  }

  return queryResults;
};

export const makeCollection = async (params: {
  url: string;
  props?: ElementCompact;
  depth?: DAVDepth;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    props,
    depth,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  return davRequest({
    url,
    init: {
      method: 'MKCOL',
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: DAVNamespaceShort.DAV,
      body: props
        ? {
            mkcol: {
              _attributes: getDAVAttribute([
                DAVNamespace.DAV,
                DAVNamespace.CALDAV,
                DAVNamespace.CARDDAV,
                DAVNamespace.CALENDAR_SERVER,
                DAVNamespace.CALDAV_APPLE,
              ]),
              set: {
                prop: props,
              },
            },
          }
        : undefined,
    },
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const supportedReportSet = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<string[]> => {
  const { collection, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const res = await propfind({
    url: collection.url,
    props: {
      [`${DAVNamespaceShort.DAV}:supported-report-set`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
  // xml-js compact output collapses repeated elements into an array, but a
  // lone `<supported-report>` element parses to a single object. Normalize to
  // an array so downstream `.map` never crashes with "map is not a function".
  const supportedReport = res[0]?.props?.supportedReportSet?.supportedReport;
  if (!supportedReport) {
    return [];
  }
  const reports = Array.isArray(supportedReport) ? supportedReport : [supportedReport];
  return reports
    .map((sr: { report?: Record<string, unknown> }) =>
      sr?.report ? Object.keys(sr.report)[0] : undefined,
    )
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
};

export const isCollectionDirty = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<{
  isDirty: boolean;
  newCtag: string | undefined;
}> => {
  const { collection, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const responses = await propfind({
    url: collection.url,
    props: {
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
  const res = responses.find((r) => urlMatches(collection.url, r.href, collection.url));
  if (!res) {
    throw new Error('Collection does not exist on server');
  }
  const unavailableCtag =
    res.propStats?.length &&
    res.propStats.every((stat) => stat.status === 404 && hasOwn(stat.props, 'getctag'));
  if (!res.ok && !unavailableCtag) {
    throw new Error(`Collection status check failed: ${res.status} ${res.statusText}`);
  }
  const remoteCtag = getDAVText(res.props?.getctag);
  return {
    isDirty:
      collection.ctag == null || remoteCtag == null || `${collection.ctag}` !== `${remoteCtag}`,
    newCtag: remoteCtag,
  };
};

/**
 * This is for webdav sync-collection only
 */
export const syncCollection = (params: {
  url: string;
  props: ElementCompact;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  syncLevel?: number;
  syncToken?: string;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    props,
    headers,
    syncLevel,
    syncToken,
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  } = params;
  return davRequest({
    url,
    init: {
      method: 'REPORT',
      namespace: DAVNamespaceShort.DAV,
      headers: excludeHeaders({ ...headers }, headersToExclude),
      body: {
        'sync-collection': {
          _attributes: getDAVAttribute([
            DAVNamespace.CALDAV,
            DAVNamespace.CARDDAV,
            DAVNamespace.DAV,
          ]),
          'sync-level': syncLevel,
          'sync-token': syncToken,
          [`${DAVNamespaceShort.DAV}:prop`]: props,
        },
      },
    },
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

/** remote collection to local */
export const smartCollectionSync: SmartCollectionSync = async <T extends DAVCollection>(params: {
  collection: T;
  method?: 'basic' | 'webdav';
  headers?: Record<string, string>;
  headersToExclude?: string[];
  account?: DAVAccount;
  detailedResult?: boolean;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<any> => {
  const {
    collection,
    method,
    headers,
    headersToExclude,
    account,
    detailedResult,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const requiredFields: Array<'accountType' | 'homeUrl'> = ['accountType', 'homeUrl'];
  if (!account || !hasFields(account, requiredFields)) {
    if (!account) {
      throw new Error('no account for smartCollectionSync');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        account,
        requiredFields,
      )} before smartCollectionSync`,
    );
  }

  const syncMethod =
    method ?? (collection.reports?.includes('syncCollection') ? 'webdav' : 'basic');
  debug(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);

  if (syncMethod === 'webdav') {
    const result = await syncCollection({
      url: collection.url,
      props: {
        [`${DAVNamespaceShort.DAV}:getetag`]: {},
        [`${
          account.accountType === 'caldav' ? DAVNamespaceShort.CALDAV : DAVNamespaceShort.CARDDAV
        }:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
        [`${DAVNamespaceShort.DAV}:displayname`]: {},
      },
      syncLevel: 1,
      syncToken: collection.syncToken,
      headers: excludeHeaders(headers, headersToExclude),
      headersToExclude,
      fetchOptions,
      fetch: fetchOverride,
    });

    const isObjectResponse = (r: DAVResponse): r is RequireAndNotNullSome<DAVResponse, 'href'> => {
      return (
        typeof r.href === 'string' &&
        getDAVUrlKey(r.href, collection.url) !== getDAVUrlKey(collection.url, collection.url) &&
        !r.props?.resourcetype?.collection
      );
    };
    const errorResponse = result.find(
      (r) =>
        (!r.ok || r.status >= 400) &&
        !(r.status === 404 && !r.propStats?.length && isObjectResponse(r)),
    );
    if (errorResponse) {
      throw new Error(
        `Collection sync failed: ${errorResponse.status} ${errorResponse.statusText}`,
      );
    }

    if (result.some((response) => response.raw && !response.raw.multistatus)) {
      throw new Error('Collection sync failed: expected a DAV multistatus response');
    }
    if (
      result.some(
        (response) =>
          response.raw?.multistatus?.response &&
          (typeof response.href !== 'string' || !response.href),
      )
    ) {
      throw new Error('Collection sync failed: missing href in DAV response');
    }
    const objectResponses = result.filter(isObjectResponse);

    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);

    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);

    const objectMultiGet = collection.objectMultiGet;
    if (changedObjectUrls.length > 0 && !objectMultiGet) {
      throw new Error('collection.objectMultiGet is required for webdav sync changes');
    }

    const multiGetObjectResponse = changedObjectUrls.length
      ? ((await objectMultiGet?.({
          url: collection.url,
          props: {
            [`${DAVNamespaceShort.DAV}:getetag`]: {},
            [`${
              account.accountType === 'caldav'
                ? DAVNamespaceShort.CALDAV
                : DAVNamespaceShort.CARDDAV
            }:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
          },
          objectUrls: changedObjectUrls,
          depth: '1',
          headers: excludeHeaders(headers, headersToExclude),
          headersToExclude,
          fetchOptions,
          fetch: fetchOverride,
        })) ?? [])
      : [];

    assertDAVObjectResponses(
      multiGetObjectResponse,
      account.accountType === 'caldav' ? 'calendarData' : 'addressData',
      changedObjectUrls,
      collection.url,
      'Collection sync multi-get failed',
    );

    const remoteObjects = multiGetObjectResponse.map((res: DAVResponse) => {
      return {
        url: resolveDAVHref(res.href ?? '', collection.url),
        etag: getDAVText(res.props?.getetag),
        data:
          account?.accountType === 'caldav'
            ? (res.props?.calendarData?._cdata ?? res.props?.calendarData)
            : (res.props?.addressData?._cdata ?? res.props?.addressData),
      };
    });

    const localObjects = collection.objects ?? [];

    const deletedObjects: DAVObject[] = deletedObjectUrls.map((url) => ({
      url: resolveDAVHref(url, collection.url),
      etag: '',
    }));
    const { created, updated, deleted, unchanged } = diffDAVObjects(
      localObjects,
      remoteObjects,
      collection.url,
      true,
      deletedObjects,
    );

    return {
      ...collection,
      objects: detailedResult
        ? { created, updated, deleted }
        : [...unchanged, ...created, ...updated],
      // all syncToken in the results are the same so we use the first one here
      syncToken: getDAVText(result[0]?.raw?.multistatus?.syncToken) ?? collection.syncToken,
    };
  }

  if (syncMethod === 'basic') {
    const { isDirty, newCtag } = await isCollectionDirty({
      collection,
      headers: excludeHeaders(headers, headersToExclude),
      headersToExclude,
      fetchOptions,
      fetch: fetchOverride,
    });

    // If the collection hasn't changed, skip the expensive fetchObjects call
    // entirely and return early. The trailing return below handles the
    // not-dirty case with an empty diff.
    if (!isDirty) {
      return detailedResult
        ? {
            ...collection,
            objects: {
              created: [],
              updated: [],
              deleted: [],
            },
          }
        : collection;
    }

    const localObjects = collection.objects ?? [];
    // The fetchObjects signature is a union of CalDAV/CardDAV variants that
    // TypeScript cannot narrow from `T extends DAVCollection`. Call via an
    // explicit any-cast, which preserves runtime behavior. The `fetch`
    // override MUST be forwarded here so custom transports (Electron,
    // Workers, KaiOS) still work in the basic/ctag-based sync fallback —
    // dropping it would silently re-route the request through the global
    // fetch, breaking those environments.
    if (!collection.fetchObjects) {
      throw new Error('collection.fetchObjects is required for basic sync changes');
    }

    const remoteObjects: DAVObject[] =
      (await (
        collection.fetchObjects as (params: {
          collection: DAVCollection;
          headers?: Record<string, string>;
          headersToExclude?: string[];
          fetchOptions?: RequestInit;
          fetch?: typeof globalThis.fetch;
        }) => Promise<DAVObject[]>
      )({
        collection,
        headers: excludeHeaders(headers, headersToExclude),
        headersToExclude,
        fetchOptions,
        fetch: fetchOverride,
      })) ?? [];

    const { created, updated, deleted, unchanged } = diffDAVObjects(
      localObjects,
      remoteObjects,
      collection.url,
    );

    return {
      ...collection,
      objects: detailedResult
        ? { created, updated, deleted }
        : [...unchanged, ...created, ...updated],
      ctag: newCtag,
    };
  }

  return detailedResult
    ? {
        ...collection,
        objects: {
          created: [],
          updated: [],
          deleted: [],
        },
      }
    : collection;
};

export const smartCollectionSyncDetailed: SmartCollectionSyncDetailed = async <
  T extends DAVCollection,
>(params: {
  collection: T;
  method?: 'basic' | 'webdav';
  headers?: Record<string, string>;
  headersToExclude?: string[];
  account?: DAVAccount;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<SmartCollectionSyncDetailedResult<T>> =>
  smartCollectionSync({ ...params, detailedResult: true });

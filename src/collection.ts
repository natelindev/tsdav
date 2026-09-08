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
import { cleanupFalsy, excludeHeaders, getDAVAttribute, urlMatches } from './util/requestHelpers';
import { findMissingFieldNames, hasFields, RequireAndNotNullSome } from './util/typeHelpers';

const debug = getLogger('tsdav:collection');

const resolveDAVHref = (href: string, baseUrl: string): string => {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
};

const hrefHasExtension = (href: string, extension: string, baseUrl: string): boolean => {
  try {
    return new URL(href, baseUrl).pathname.toLowerCase().endsWith(extension);
  } catch {
    return (href.split(/[?#]/, 1)[0] ?? '').toLowerCase().endsWith(extension);
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
        errorResponse.raw ? `Raw response: ${errorResponse.raw}` : ''
      }`,
    );
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
              set: {
                prop: props,
              },
            },
          }
        : undefined,
    },
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
  newCtag: string;
}> => {
  const { collection, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const responses = await propfind({
    url: collection.url,
    props: {
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride,
  });
  const res = responses.find((r) => urlMatches(collection.url, r.href, collection.url));
  if (!res) {
    throw new Error('Collection does not exist on server');
  }
  if (!res.ok) {
    throw new Error(`Collection status check failed: ${res.status} ${res.statusText}`);
  }
  const remoteCtag = res.props?.getctag;
  return {
    isDirty:
      collection.ctag == null || remoteCtag == null || `${collection.ctag}` !== `${remoteCtag}`,
    newCtag: remoteCtag?.toString(),
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
      fetchOptions,
      fetch: fetchOverride,
    });

    const isObjectResponse = (r: DAVResponse): r is RequireAndNotNullSome<DAVResponse, 'href'> => {
      const extName = account.accountType === 'caldav' ? '.ics' : '.vcf';
      return typeof r.href === 'string' && hrefHasExtension(r.href, extName, collection.url);
    };
    const errorResponse = result.find(
      (r) => (!r.ok || r.status >= 400) && !(r.status === 404 && isObjectResponse(r)),
    );
    if (errorResponse) {
      throw new Error(
        `Collection sync failed: ${errorResponse.status} ${errorResponse.statusText}`,
      );
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
          fetchOptions,
          fetch: fetchOverride,
        })) ?? [])
      : [];

    const multiGetError = multiGetObjectResponse.find((r: DAVResponse) => !r.ok || r.status >= 400);
    if (multiGetError) {
      throw new Error(
        `Collection sync multi-get failed: ${multiGetError.status} ${multiGetError.statusText}`,
      );
    }

    const remoteObjects = multiGetObjectResponse.map((res: DAVResponse) => {
      return {
        url: resolveDAVHref(res.href ?? '', collection.url),
        etag: res.props?.getetag == null ? undefined : String(res.props.getetag),
        data:
          account?.accountType === 'caldav'
            ? (res.props?.calendarData?._cdata ?? res.props?.calendarData)
            : (res.props?.addressData?._cdata ?? res.props?.addressData),
      };
    });

    const localObjects = collection.objects ?? [];

    // no existing url
    const created: DAVObject[] = remoteObjects.filter((o: DAVObject) =>
      localObjects.every((lo) => !urlMatches(lo.url, o.url, collection.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro: DAVObject) =>
        urlMatches(ro.url, curr.url, collection.url),
      );
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    const deleted: DAVObject[] = deletedObjectUrls.map((o) => ({
      url: resolveDAVHref(o, collection.url),
      etag: '',
    }));
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);
    const unchanged = localObjects.filter(
      (localObject) =>
        deleted.every(
          (deletedObject) => !urlMatches(localObject.url, deletedObject.url, collection.url),
        ) &&
        updated.every(
          (updatedObject) => !urlMatches(localObject.url, updatedObject.url, collection.url),
        ),
    );

    return {
      ...collection,
      objects: detailedResult
        ? { created, updated, deleted }
        : [...unchanged, ...created, ...updated],
      // all syncToken in the results are the same so we use the first one here
      syncToken: result[0]?.raw?.multistatus?.syncToken ?? collection.syncToken,
    };
  }

  if (syncMethod === 'basic') {
    const { isDirty, newCtag } = await isCollectionDirty({
      collection,
      headers: excludeHeaders(headers, headersToExclude),
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
          fetchOptions?: RequestInit;
          fetch?: typeof globalThis.fetch;
        }) => Promise<DAVObject[]>
      )({
        collection,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride,
      })) ?? [];

    // no existing url
    const created = remoteObjects.filter((ro: DAVObject) =>
      localObjects.every((lo) => !urlMatches(lo.url, ro.url, collection.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro: DAVObject) =>
        urlMatches(ro.url, curr.url, collection.url),
      );
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    // does not present in remote
    const deleted = localObjects.filter((cal) =>
      remoteObjects.every((ro: DAVObject) => !urlMatches(ro.url, cal.url, collection.url)),
    );
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);

    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some(
        (ro: DAVObject) => urlMatches(lo.url, ro.url, collection.url) && ro.etag === lo.etag,
      ),
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

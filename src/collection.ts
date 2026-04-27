/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';
import { ElementCompact } from 'xml-js';

import { DAVNamespace, DAVNamespaceShort } from './consts';
import { davRequest, propfind } from './request';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { SmartCollectionSync } from './types/functionsOverloads';
import { DAVAccount, DAVCollection, DAVObject } from './types/models';
import { cleanupFalsy, excludeHeaders, getDAVAttribute, urlContains } from './util/requestHelpers';
import { findMissingFieldNames, hasFields, RequireAndNotNullSome } from './util/typeHelpers';

const debug = getLogger('tsdav:collection');

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

  const errorResponse = queryResults.find((res) => !res.ok || (res.status && res.status >= 400));
  if (errorResponse) {
    throw new Error(
      `Collection query failed: ${errorResponse.status} ${errorResponse.statusText}. ${
        errorResponse.raw ? `Raw response: ${errorResponse.raw}` : ''
      }`,
    );
  }

  // empty query result
  if (
    queryResults.length === 1 &&
    !queryResults[0].raw &&
    queryResults[0].status &&
    queryResults[0].status < 300
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
  const res = responses.filter((r) => urlContains(collection.url, r.href))[0];
  if (!res) {
    throw new Error('Collection does not exist on server');
  }
  return {
    isDirty: `${collection.ctag}` !== `${res.props?.getctag}`,
    newCtag: res.props?.getctag?.toString(),
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

    const objectResponses = result.filter((r): r is RequireAndNotNullSome<DAVResponse, 'href'> => {
      const extName = account.accountType === 'caldav' ? '.ics' : '.vcf';
      return r.href?.slice(-4) === extName;
    });

    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);

    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);

    const multiGetObjectResponse = changedObjectUrls.length
      ? ((await collection.objectMultiGet?.({
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

    const remoteObjects = multiGetObjectResponse.map((res: DAVResponse) => {
      return {
        url: res.href ?? '',
        etag: res.props?.getetag,
        data:
          account?.accountType === 'caldav'
            ? (res.props?.calendarData?._cdata ?? res.props?.calendarData)
            : (res.props?.addressData?._cdata ?? res.props?.addressData),
      };
    });

    const localObjects = collection.objects ?? [];

    // no existing url
    const created: DAVObject[] = remoteObjects.filter((o: DAVObject) =>
      localObjects.every((lo) => !urlContains(lo.url, o.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro: DAVObject) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    const deleted: DAVObject[] = deletedObjectUrls.map((o) => ({
      url: o,
      etag: '',
    }));
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);
    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some((ro: DAVObject) => urlContains(lo.url, ro.url) && ro.etag === lo.etag),
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
    const remoteObjects: DAVObject[] =
      (await (
        collection.fetchObjects as
          | ((params: {
              collection: DAVCollection;
              headers?: Record<string, string>;
              fetchOptions?: RequestInit;
              fetch?: typeof globalThis.fetch;
            }) => Promise<DAVObject[]>)
          | undefined
      )?.({
        collection,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride,
      })) ?? [];

    // no existing url
    const created = remoteObjects.filter((ro: DAVObject) =>
      localObjects.every((lo) => !urlContains(lo.url, ro.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro: DAVObject) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    // does not present in remote
    const deleted = localObjects.filter((cal) =>
      remoteObjects.every((ro: DAVObject) => !urlContains(ro.url, cal.url)),
    );
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);

    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some((ro: DAVObject) => urlContains(lo.url, ro.url) && ro.etag === lo.etag),
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

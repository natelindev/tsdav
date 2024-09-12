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
}): Promise<DAVResponse[]> => {
  const {
    url,
    body,
    depth,
    defaultNamespace = DAVNamespaceShort.DAV,
    headers,
    headersToExclude,
    fetchOptions = {}
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
  });

  // empty query result
  if (queryResults.length === 1 && !queryResults[0].raw) {
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
}): Promise<DAVResponse[]> => {
  const { url, props, depth, headers, headersToExclude, fetchOptions = {} } = params;
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
    fetchOptions
  });
};

export const supportedReportSet = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
}): Promise<string[]> => {
  const { collection, headers, headersToExclude, fetchOptions = {} } = params;
  const res = await propfind({
    url: collection.url,
    props: {
      [`${DAVNamespaceShort.DAV}:supported-report-set`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions
  });
  return (
    res[0]?.props?.supportedReportSet?.supportedReport?.map(
      (sr: { report: any }) => Object.keys(sr.report)[0],
    ) ?? []
  );
};

export const isCollectionDirty = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
}): Promise<{
  isDirty: boolean;
  newCtag: string;
}> => {
  const { collection, headers, headersToExclude, fetchOptions = {} } = params;
  const responses = await propfind({
    url: collection.url,
    props: {
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
    },
    depth: '0',
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions
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
}): Promise<DAVResponse[]> => {
  const { url, props, headers, syncLevel, syncToken, headersToExclude, fetchOptions } = params;
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
    fetchOptions
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
}): Promise<any> => {
  const { collection, method, headers, headersToExclude, account, detailedResult, fetchOptions = {} } = params;
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
      fetchOptions
    });

    const objectResponses = result.filter((r): r is RequireAndNotNullSome<DAVResponse, 'href'> => {
      const extName = account.accountType === 'caldav' ? '.ics' : '.vcf';
      return r.href?.slice(-4) === extName;
    });

    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);

    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);

    const multiGetObjectResponse = changedObjectUrls.length
      ? ((await collection?.objectMultiGet?.({
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
          fetchOptions
        })) ?? [])
      : [];

    const remoteObjects = multiGetObjectResponse.map((res) => {
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
    const created: DAVObject[] = remoteObjects.filter((o) =>
      localObjects.every((lo) => !urlContains(lo.url, o.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
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
      remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag),
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
      fetchOptions
    });
    const localObjects = collection.objects ?? [];
    const remoteObjects =
      (await collection.fetchObjects?.({
        collection,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions
      })) ?? [];

    // no existing url
    const created = remoteObjects.filter((ro) =>
      localObjects.every((lo) => !urlContains(lo.url, ro.url)),
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce<DAVObject[]>((prev, curr) => {
      const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    // does not present in remote
    const deleted = localObjects.filter((cal) =>
      remoteObjects.every((ro) => !urlContains(ro.url, cal.url)),
    );
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);

    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag),
    );

    if (isDirty) {
      return {
        ...collection,
        objects: detailedResult
          ? { created, updated, deleted }
          : [...unchanged, ...created, ...updated],
        ctag: newCtag,
      };
    }
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

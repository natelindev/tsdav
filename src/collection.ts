/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';

import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { davRequest, propfind } from './request';
import { DAVDepth, DAVProp, DAVResponse } from './types/DAVTypes';
import { SmartCollectionSync } from './types/functionsOverloads';
import { DAVAccount, DAVCollection, DAVObject } from './types/models';
import { cleanupFalsy, formatProps, getDAVAttribute, urlContains } from './util/requestHelpers';
import { findMissingFieldNames, hasFields, RequireAndNotNullSome } from './util/typeHelper';

const debug = getLogger('tsdav:collection');

export const collectionQuery = async (params: {
  url: string;
  body: any;
  depth?: DAVDepth;
  defaultNamespace?: DAVNamespace;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, body, depth, defaultNamespace, headers } = params;
  return davRequest({
    url,
    init: {
      method: 'REPORT',
      headers: cleanupFalsy({ ...headers, depth }),
      namespace: DAVNamespaceShorthandMap[defaultNamespace ?? DAVNamespace.DAV],
      body,
    },
  });
};

export const makeCollection = async (params: {
  url: string;
  props?: DAVProp[];
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, depth, headers } = params;
  return davRequest({
    url,
    init: {
      method: 'MKCOL',
      headers: cleanupFalsy({ ...headers, depth }),
      namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
      body: props
        ? {
            mkcol: {
              set: {
                prop: formatProps(props),
              },
            },
          }
        : undefined,
    },
  });
};

export const supportedReportSet = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
}): Promise<DAVResponse> => {
  const { collection, headers } = params;
  const res = await propfind({
    url: collection.url,
    props: [{ name: 'supported-report-set', namespace: DAVNamespace.DAV }],
    depth: '1',
    headers,
  });
  return res[0]?.props?.supportedReportSet.supportedReport.map(
    (sr: { report: any }) => Object.keys(sr.report)[0]
  );
};

export const isCollectionDirty = async (params: {
  collection: DAVCollection;
  headers?: Record<string, string>;
}): Promise<{
  isDirty: boolean;
  newCtag: string;
}> => {
  const { collection, headers } = params;
  const responses = await propfind({
    url: collection.url,
    props: [{ name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER }],
    depth: '0',
    headers,
  });
  const res = responses.filter((r) => urlContains(collection.url, r.href))[0];
  if (!res) {
    throw new Error('Collection does not exist on server');
  }
  return { isDirty: collection.ctag !== res.props?.getctag, newCtag: res.props?.getctag };
};

/**
 * This is for webdav sync-collection only
 */
export const syncCollection = (params: {
  url: string;
  props: DAVProp[];
  headers?: Record<string, string>;
  syncLevel?: number;
  syncToken?: string;
}): Promise<DAVResponse[]> => {
  const { url, props, headers, syncLevel, syncToken } = params;
  return davRequest({
    url,
    init: {
      method: 'REPORT',
      namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
      headers: { ...headers },
      body: {
        'sync-collection': {
          _attributes: getDAVAttribute([
            DAVNamespace.CALDAV,
            DAVNamespace.CARDDAV,
            DAVNamespace.DAV,
          ]),
          'sync-level': syncLevel,
          'sync-token': syncToken,
          [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        },
      },
    },
  });
};

/** remote collection to local */
export const smartCollectionSync: SmartCollectionSync = async <T extends DAVCollection>(params: {
  collection: T;
  method?: 'basic' | 'webdav';
  headers?: Record<string, string>;
  account?: DAVAccount;
  detailedResult?: boolean;
}): Promise<any> => {
  const { collection, method, headers, account, detailedResult } = params;
  const requiredFields: Array<'accountType' | 'homeUrl'> = ['accountType', 'homeUrl'];
  if (!account || !hasFields(account, requiredFields)) {
    if (!account) {
      throw new Error('no account for smartCollectionSync');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        account,
        requiredFields
      )} before smartCollectionSync`
    );
  }

  const syncMethod =
    method ?? (collection.reports?.includes('syncCollection') ? 'webdav' : 'basic');
  debug(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);

  if (syncMethod === 'webdav') {
    const result = await syncCollection({
      url: collection.url,
      props: [
        { name: 'getetag', namespace: DAVNamespace.DAV },
        {
          name: account.accountType === 'caldav' ? 'calendar-data' : 'address-data',
          namespace: account.accountType === 'caldav' ? DAVNamespace.CALDAV : DAVNamespace.CARDDAV,
        },
        {
          name: 'displayname',
          namespace: DAVNamespace.DAV,
        },
      ],
      syncLevel: 1,
      syncToken: collection.syncToken,
      headers,
    });

    const objectResponses = result.filter(
      (r): r is RequireAndNotNullSome<DAVResponse, 'href'> => r.href?.slice(-4) === '.ics'
    );

    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);

    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);

    const multiGetObjectResponse = changedObjectUrls.length
      ? (await collection?.objectMultiGet?.({
          url: collection.url,
          props: [
            { name: 'getetag', namespace: DAVNamespace.DAV },
            {
              name: account.accountType === 'caldav' ? 'calendar-data' : 'address-data',
              namespace:
                account.accountType === 'caldav' ? DAVNamespace.CALDAV : DAVNamespace.CARDDAV,
            },
          ],
          objectUrls: changedObjectUrls,
          depth: '1',
          headers,
        })) ?? []
      : [];

    const remoteObjects = multiGetObjectResponse.map((res) => {
      return {
        url: res.href ?? '',
        etag: res.props?.getetag,
        data:
          account?.accountType === 'caldav'
            ? res.props?.calendarData?._cdata ?? res.props?.calendarData
            : res.props?.addressData?._cdata ?? res.props?.addressData,
      };
    });

    const localObjects = collection.objects ?? [];

    // no existing url
    const created: DAVObject[] = remoteObjects.filter((o) =>
      localObjects.every((lo) => !urlContains(lo.url, o.url))
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce((prev, curr) => {
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
      remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag)
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
      headers,
    });
    const localObjects = collection.objects ?? [];
    const remoteObjects = (await collection.fetchObjects?.({ collection, headers })) ?? [];

    // no existing url
    const created = remoteObjects.filter((ro) =>
      localObjects.every((lo) => !urlContains(lo.url, ro.url))
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce((prev, curr) => {
      const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    // does not present in remote
    const deleted = localObjects.filter((cal) =>
      remoteObjects.every((ro) => !urlContains(ro.url, cal.url))
    );
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);

    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag)
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

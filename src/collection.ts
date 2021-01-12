import getLogger from 'debug';
import URL from 'url';
import { DAVDepth, DAVProp, DAVResponse } from './types/DAVTypes';
import { DAVAccount, DAVCollection, DAVObject } from './types/models';

import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { davRequest, propfind } from './request';
import { SmartCollectionSync } from './types/functionsOverloads';
import { formatProps, getDAVAttribute, urlEquals } from './util/requestHelpers';
import { findMissingFieldNames, hasFields, RequireAndNotNullSome } from './util/typeHelper';

const debug = getLogger('tsdav:collection');

export const collectionQuery = async (
  url: string,
  body: any,
  options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
): Promise<DAVResponse[]> => {
  return davRequest(url, {
    method: 'REPORT',
    headers: { ...options?.headers, depth: options?.depth },
    namespace: DAVNamespaceShorthandMap[DAVNamespace.CALDAV],
    body,
  });
};

export const makeCollection = async (
  url: string,
  props?: DAVProp[],
  options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
): Promise<DAVResponse[]> => {
  return davRequest(url, {
    method: 'MKCOL',
    headers: { ...options?.headers, depth: options?.depth },
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
  });
};

export const supportedReportSet = async (
  collection: DAVCollection,
  options?: { headers?: { [key: string]: any } }
): Promise<DAVResponse> => {
  const res = await propfind(
    collection.url,
    [{ name: 'supported-report-set', namespace: DAVNamespace.DAV }],
    { depth: '1', headers: options?.headers }
  );
  return res[0]?.props?.supportedReportSet.supportedReport.map(
    (sr: { report: any }) => Object.keys(sr.report)[0]
  );
};

export const isCollectionDirty = async (
  collection: DAVCollection,
  options?: { headers?: { [key: string]: any } }
): Promise<{
  isDirty: boolean;
  newCtag: string;
}> => {
  const responses = await propfind(
    collection.url,
    [{ name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER }],
    {
      depth: '0',
      headers: options?.headers,
    }
  );
  const res = responses.filter((r) => urlEquals(collection.url, r.href))[0];
  if (!res) {
    throw new Error('Collection does not exist on server');
  }
  return { isDirty: collection.ctag !== res.props?.getctag, newCtag: res.props?.getctag };
};

/**
 * This is for webdav sync-collection only
 */
export const syncCollection = (
  url: string,
  props: DAVProp[],
  options?: {
    headers?: { [key: string]: any };
    syncLevel?: number;
    syncToken?: string;
  }
): Promise<DAVResponse[]> => {
  return davRequest(url, {
    method: 'REPORT',
    namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
    headers: { ...options?.headers },
    body: {
      'sync-collection': {
        _attributes: getDAVAttribute([DAVNamespace.CALDAV, DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        'sync-level': options?.syncLevel,
        'sync-token': options?.syncToken,
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
      },
    },
  });
};

/** remote collection to local */
export const smartCollectionSync: SmartCollectionSync = async <T extends DAVCollection>(
  collection: T,
  method?: 'basic' | 'webdav',
  options?: { headers?: { [key: string]: any }; account?: DAVAccount; detailedResult?: boolean }
): Promise<any> => {
  const requiredFields: Array<'accountType' | 'homeUrl'> = ['accountType', 'homeUrl'];
  if (!options?.account || !hasFields(options?.account, requiredFields)) {
    if (!options?.account) {
      throw new Error('no account for smartCollectionSync');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        options.account,
        requiredFields
      )} before smartCollectionSync`
    );
  }

  const syncMethod =
    method ?? (collection.reports?.includes('syncCollection') ? 'webdav' : 'basic');
  debug(`smart collection sync with type ${options?.account.accountType} and method ${syncMethod}`);

  if (syncMethod === 'webdav') {
    const result = await syncCollection(
      collection.url,
      [
        { name: 'getetag', namespace: DAVNamespace.DAV },
        {
          name: options.account.accountType === 'caldav' ? 'calendar-data' : 'address-data',
          namespace:
            options.account.accountType === 'caldav' ? DAVNamespace.CALDAV : DAVNamespace.CARDDAV,
        },
        {
          name: 'displayname',
          namespace: DAVNamespace.DAV,
        },
      ],
      {
        syncLevel: 1,
        syncToken: collection.syncToken,
        headers: options?.headers,
      }
    );

    const objectResponses = result.filter(
      (r): r is RequireAndNotNullSome<DAVResponse, 'href'> => r.href?.slice(-4) === '.ics'
    );

    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);

    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);

    const multiGetObjectResponse = changedObjectUrls.length
      ? (await collection?.objectMultiGet?.(
          collection.url,
          [
            { name: 'getetag', namespace: DAVNamespace.DAV },
            {
              name: options.account.accountType === 'caldav' ? 'calendar-data' : 'address-data',
              namespace:
                options.account.accountType === 'caldav'
                  ? DAVNamespace.CALDAV
                  : DAVNamespace.CARDDAV,
            },
          ],
          changedObjectUrls,
          { depth: '1', headers: options?.headers }
        )) ?? []
      : [];

    const remoteObjects = multiGetObjectResponse.map((res) => {
      return {
        url: res.href ?? '',
        etag: res.props?.getetag,
        data:
          options.account?.accountType === 'caldav'
            ? // eslint-disable-next-line no-underscore-dangle
              res.props?.calendarData._cdata ?? res.props?.calendarData
            : res.props?.addressData,
      };
    });

    const localObjects = collection.objects ?? [];

    // no existing url
    const created: DAVObject[] = remoteObjects.filter((o) =>
      localObjects.every((lo) => !urlEquals(lo.url, o.url))
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce((prev, curr) => {
      const found = remoteObjects.find((ro) => urlEquals(ro.url, curr.url));
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
      remoteObjects.some((ro) => urlEquals(lo.url, ro.url) && ro.etag === lo.etag)
    );

    return {
      ...collection,
      objects: options.detailedResult
        ? { created, updated, deleted }
        : [...unchanged, ...created, ...updated],
      // all syncToken in the results are the same so we use the first one here
      syncToken: result[0]?.raw?.multistatus?.syncToken ?? collection.syncToken,
    };
  }

  if (syncMethod === 'basic') {
    const { isDirty, newCtag } = await isCollectionDirty(collection, {
      headers: options?.headers,
    });
    const localObjects = collection.objects ?? [];
    const remoteObjects =
      (await collection.fetchObjects?.(collection, { headers: options?.headers })) ?? [];

    // no existing url
    const created = remoteObjects.filter((ro) =>
      localObjects.every((lo) => !urlEquals(lo.url, ro.url))
    );
    // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);

    // have same url, but etag different
    const updated = localObjects.reduce((prev, curr) => {
      const found = remoteObjects.find((ro) => urlEquals(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);

    // does not present in remote
    const deleted = localObjects.filter((cal) =>
      remoteObjects.every((ro) => !urlEquals(ro.url, cal.url))
    );
    // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);

    const unchanged = localObjects.filter((lo) =>
      remoteObjects.some((ro) => urlEquals(lo.url, ro.url) && ro.etag === lo.etag)
    );

    if (isDirty) {
      return {
        ...collection,
        objects: options.detailedResult
          ? { created, updated, deleted }
          : [...unchanged, ...created, ...updated],
        ctag: newCtag,
      };
    }
  }

  return options.detailedResult
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

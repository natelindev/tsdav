import { DAVDepth, DAVProp, DAVResponse } from 'DAVTypes';
import getLogger from 'debug';

import { DAVCollection, DAVObject } from 'models';
import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { davRequest, propfind } from './request';
import { getDAVAttribute, formatProps, urlEquals } from './util/requestHelpers';

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
): Promise<boolean> => {
  if (!collection.ctag) {
    return false;
  }
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

  return collection.ctag !== res.props?.getctag;
};

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

export const smartCollectionSync = async <T extends DAVCollection>(
  collection: T,
  method?: 'basic' | 'webdav',
  options?: { headers?: { [key: string]: any } }
): Promise<T> => {
  if (!collection.account?.accountType) {
    throw new Error('unable to sync collection with no account or no proper accountType');
  }
  const syncMethod = method ?? collection.reports?.includes('syncCollection') ? 'webdav' : 'basic';
  debug(
    `smart collection sync with type ${collection.account.accountType} and method ${syncMethod}`
  );
  if (syncMethod === 'webdav') {
    const result = await syncCollection(
      collection.url,
      [
        { name: 'getetag', namespace: DAVNamespace.DAV },
        {
          name: collection.account?.accountType === 'caldav' ? 'calendar-data' : 'address-data',
          namespace:
            collection.account?.accountType === 'caldav'
              ? DAVNamespace.CALDAV
              : DAVNamespace.CARDDAV,
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

    debug(result);

    return {
      ...collection,
      objects: collection.objects?.map((c) => {
        const found = result.find((r) => urlEquals(r.href, c.url));
        if (found) {
          return { ...c, etag: found.props?.getetag, objects: found.props?.calendarData };
        }
        return c;
      }),
      syncToken: '',
    };
  }
  if (syncMethod === 'basic') {
    const isDirty = await isCollectionDirty(collection, {
      headers: options?.headers,
    });
    if (isDirty) {
      return {
        ...collection,
        objects: await collection.fetchObjects?.(collection, { headers: options?.headers }),
      };
    }
  }
  return collection;
};

import { DAVDepth, DAVProp, DAVResponse } from 'DAVTypes';
import getLogger from 'debug';

import { DAVCollection } from 'models';
import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { davRequest, propfind } from './request';
import { getDAVAttribute, formatProps, urlEquals } from './util/requestHelpers';

const debug = getLogger('tsdav:collection');

export async function collectionQuery(
  url: string,
  body: any,
  options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
): Promise<DAVResponse[]> {
  return davRequest(url, {
    method: 'REPORT',
    headers: { ...options.headers, Depth: options.depth },
    body,
  });
}

export const supportedReportSet = async (
  collection: DAVCollection,
  options?: { headers?: { [key: string]: any } }
): Promise<DAVResponse> => {
  const res = await propfind(
    collection.url,
    [{ name: 'supported-report-set', namespace: DAVNamespace.DAV }],
    { depth: '1', headers: options.headers }
  );
  return res[0]?.props?.supportedReportSet;
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
      headers: options.headers,
    }
  );
  const res = responses.filter((r) => urlEquals(collection.url, r.href))[0];
  if (!res) {
    throw new Error('Collection does not exist on server');
  }

  return collection.ctag !== res.props.getctag;
};

export const syncCollection = (
  url: string,
  props: DAVProp[],
  options?: {
    headers?: { [key: string]: any };
    depth?: DAVDepth;
    syncLevel?: number;
    syncToken?: string;
  }
): Promise<DAVResponse[]> => {
  return davRequest(url, {
    method: 'REPORT',
    namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
    headers: { ...options.headers, Depth: options.depth },
    body: {
      'sync-collection': {
        _attributes: getDAVAttribute([DAVNamespace.CALDAV, DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        'sync-level': options.syncLevel,
        'sync-token': options.syncToken,
        prop: formatProps(props),
      },
    },
  });
};

export const smartCollectionSync = async <T extends DAVCollection>(
  collection: T,
  method: 'basic' | 'webdav',
  options?: { headers?: { [key: string]: any } }
): Promise<T> => {
  const syncMethod = method ?? collection.reports?.includes('syncCollection') ? 'webdav' : 'basic';
  if (syncMethod === 'webdav') {
    const result = await syncCollection(
      collection.url,
      [
        { name: 'getetag', namespace: DAVNamespace.DAV },
        { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
      ],
      {
        syncLevel: 1,
        syncToken: collection.syncToken,
        headers: options.headers,
      }
    );

    return {
      ...collection,
      objects: collection.objects.map((c) => {
        const found = result.find((r) => urlEquals(r.href, c.url));
        if (found) {
          return { etag: found.props.getetag };
        }
        return c;
      }),
    };
  }
  if (syncMethod === 'basic') {
    const isDirty = await isCollectionDirty(collection, {
      headers: options.headers,
    });
    if (isDirty) {
      return { ...collection, objects: {} };
    }
  }
  return collection;
};

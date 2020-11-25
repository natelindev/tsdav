import { fetch } from 'cross-fetch';
import getLogger from 'debug';
import convert from 'xml-js';

import { DAVDepth, DAVFilter, DAVProp } from 'requestTypes';
import { nativeType } from './util/nativeType';

import { DAVNamespace, DAVMethods, HTTPMethods, DAVNamespaceShorthandMap } from './consts';
import { getDAVAttribute, formatProps, formatFilters } from './util/requestHelper';

const debug = getLogger('tsdav:request');

type RawProp = { prop: { [key: string]: any }; status: string; responsedescription?: string };
type RawResponse = {
  href: string;
  status: string;
  ok: boolean;
  error: { [key: string]: any };
  responsedescription: string;
  propstat: RawProp | RawProp[];
};

export type DAVResponse = {
  href?: string;
  status: number;
  statusText: string;
  ok: boolean;
  error?: { [key: string]: any };
  responsedescription?: string;
  props?: { [key: string]: { status: number; statusText: string; ok: boolean; value: any } };
};

export type DAVRequest = {
  headers?: { [key: string]: any };
  method: DAVMethods | HTTPMethods;
  body: any;
  namespace?: string;
  attributes?: { [key: string]: any };
};

export async function davRequest(url: string, options: DAVRequest): Promise<DAVResponse[]> {
  const { headers, body, namespace, method, attributes } = options;
  const xmlBody = convert.js2xml(
    { ...body, _attributes: attributes },
    {
      compact: true,
      spaces: 2,
      elementNameFn: (name) => {
        // add namespace to all keys without namespace
        if (namespace && !/^.+:.+/.test(name)) {
          return `${namespace}:${name}`;
        }
        return name;
      },
    }
  );

  const davResponse = await fetch(url, {
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', ...headers },
    body: xmlBody,
    method,
  });

  const resText = await davResponse.text();

  // filter out invalid responses
  debug(resText);
  if (!davResponse.ok || !davResponse.headers.get('content-type').includes('xml')) {
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        responsedescription: resText,
      },
    ];
  }

  const result: any = convert.xml2js(resText, {
    compact: true,
    trim: true,
    textFn: (value: any, parentElement: any) => {
      try {
        // This is needed for xml-js design reasons
        // eslint-disable-next-line no-underscore-dangle
        const parentOfParent = parentElement._parent;
        const pOpKeys = Object.keys(parentOfParent);
        const keyNo = pOpKeys.length;
        const keyName = pOpKeys[keyNo - 1];
        const arrOfKey = parentOfParent[keyName];
        const arrOfKeyLen = arrOfKey.length;
        if (arrOfKeyLen > 0) {
          const arr = arrOfKey;
          const arrIndex = arrOfKey.length - 1;
          arr[arrIndex] = nativeType(value);
        } else {
          parentOfParent[keyName] = nativeType(value);
        }
      } catch (e) {
        debug(e.stack);
      }
    },
    // remove namespace
    elementNameFn: (attributeName) => attributeName.replace(/^.+:/, ''),
    ignoreAttributes: true,
    ignoreDeclaration: true,
  });

  const responseBodies: RawResponse[] = Array.isArray(result.multistatus.response)
    ? result.multistatus.response
    : [result.multistatus.response];

  return responseBodies.map((responseBody) => {
    const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
    const matchArr = statusRegex.exec(responseBody.status);

    return {
      href: responseBody.href,
      status: matchArr ? Number.parseInt(matchArr?.groups.status, 10) : davResponse.status,
      statusText: matchArr?.groups.statusText ?? davResponse.statusText,
      ok: !responseBody.error,
      error: responseBody.error,
      responsedescription: responseBody.responsedescription,
      props: (Array.isArray(responseBody.propstat)
        ? responseBody.propstat
        : [responseBody.propstat]
      ).reduce((prev, curr) => {
        const innerMatchArr = statusRegex.exec(curr.status);
        const statusCode = Number.parseInt(innerMatchArr?.groups.status, 10);
        return {
          ...prev,
          [Object.keys(curr.prop)[0]]: {
            value: curr.prop,
            status: statusCode,
            ok: statusCode >= 200 && statusCode < 400,
            statusText: innerMatchArr && innerMatchArr.groups.statusText,
            responsedescription: curr.responsedescription,
          },
        };
      }, {}),
    };
  });
}

export async function propfind(
  url: string,
  props: DAVProp[],
  options: { depth: DAVDepth }
): Promise<DAVResponse[]> {
  return davRequest(url, {
    method: 'PROPFIND',
    headers: { Depth: options.depth },
    namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
    body: {
      propfind: {
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CARDDAV,
          DAVNamespace.DAV,
        ]),
        prop: formatProps(props),
      },
    },
  });
}

export async function syncCollection(
  url: string,
  props: DAVProp[],
  options: {
    depth: DAVDepth;
    syncLevel: number;
    syncToken: string;
  }
): Promise<DAVResponse[]> {
  return davRequest(url, {
    method: 'REPORT',
    namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
    headers: { Depth: options.depth },
    body: {
      'sync-collection': {
        _attributes: getDAVAttribute([DAVNamespace.CALDAV, DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        'sync-level': options.syncLevel,
        'sync-token': options.syncToken,
        prop: formatProps(props),
      },
    },
  });
}

export async function collectionQuery(
  url: string,
  body: any,
  options: { depth: DAVDepth }
): Promise<DAVResponse[]> {
  return davRequest(url, {
    method: 'REPORT',
    headers: { Depth: options.depth },
    body,
  });
}

export async function addressBookQuery(
  url: string,
  props: DAVProp[],
  depth: DAVDepth
): Promise<DAVResponse[]> {
  return collectionQuery(
    url,
    {
      'addressbook-query': {
        _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        prop: formatProps(props),
        filter: {
          'prop-filter': {
            _attributes: {
              name: 'FN',
            },
          },
        },
      },
    },
    { depth }
  );
}

export async function calendarQuery(
  url: string,
  props: DAVProp[],
  filters: DAVFilter[],
  timezone: string,
  depth: DAVDepth
): Promise<DAVResponse[]> {
  return collectionQuery(
    url,
    {
      'calendar-query': {
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.DAV,
        ]),
        prop: formatProps(props),
        filter: formatFilters(filters),
        timezone,
      },
    },
    { depth }
  );
}

export async function createObject(
  url: string,
  data: string,
  headers: { [key: string]: any }
): Promise<Response> {
  return fetch(url, { method: 'PUT', body: data, headers });
}

export async function updateObject(
  url: string,
  data: string,
  etag: string,
  headers: { [key: string]: any }
): Promise<Response> {
  return fetch(url, { method: 'PUT', body: data, headers: { ...headers, 'If-Match': etag } });
}

export async function deleteObject(
  url: string,
  data: string,
  etag: string,
  headers: { [key: string]: any }
): Promise<Response> {
  return fetch(url, { method: 'DELETE', body: data, headers: { ...headers, 'If-Match': etag } });
}

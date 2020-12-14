import { fetch } from 'cross-fetch';
import getLogger from 'debug';
import { DAVDepth, DAVProp, DAVRequest, DAVResponse } from 'DAVTypes';
import convert from 'xml-js';

import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { camelCase } from './util/camelCase';
import { nativeType } from './util/nativeType';
import { formatProps, getDAVAttribute } from './util/requestHelpers';

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

export async function davRequest(
  url: string,
  init: DAVRequest,
  options?: { convertIncoming?: boolean; parseOutgoing?: boolean }
): Promise<DAVResponse[]> {
  const { headers, body, namespace, method, attributes } = init;
  const { convertIncoming = true, parseOutgoing = true } = options ?? {};
  const xmlBody = convertIncoming
    ? convert.js2xml(
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
      )
    : body;

  // debug('outgoing xml:');
  // debug(xmlBody);
  const davResponse = await fetch(url, {
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', ...headers },
    body: xmlBody,
    method,
  });

  const resText = await davResponse.text();

  // filter out invalid responses
  // debug('response xml:');
  // debug(resText);
  if (
    !davResponse.ok ||
    !davResponse.headers.get('content-type')?.includes('xml') ||
    !parseOutgoing
  ) {
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
    // remove namespace & camelCase
    elementNameFn: (attributeName) => camelCase(attributeName.replace(/^.+:/, '')),
    attributesFn: (value: any) => {
      const newVal = { ...value };
      delete newVal.xmlns;
      return newVal;
    },
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
      status: matchArr?.groups ? Number.parseInt(matchArr?.groups.status, 10) : davResponse.status,
      statusText: matchArr?.groups?.statusText ?? davResponse.statusText,
      ok: !responseBody.error,
      error: responseBody.error,
      responsedescription: responseBody.responsedescription,
      props: (Array.isArray(responseBody.propstat)
        ? responseBody.propstat
        : [responseBody.propstat]
      ).reduce((prev, curr) => {
        return {
          ...prev,
          ...curr.prop,
        };
      }, {}),
    };
  });
}

export async function propfind(
  url: string,
  props: DAVProp[],
  options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
): Promise<DAVResponse[]> {
  return davRequest(url, {
    method: 'PROPFIND',
    headers: { ...options?.headers, Depth: options?.depth },
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

export async function createObject(
  url: string,
  data: any,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> {
  return fetch(url, { method: 'PUT', body: data, headers: options?.headers });
}

export async function updateObject(
  url: string,
  data: any,
  etag: string,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> {
  return fetch(url, {
    method: 'PUT',
    body: data,
    headers: { ...options?.headers, 'If-Match': etag },
  });
}

export async function deleteObject(
  url: string,
  etag: string,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> {
  return fetch(url, { method: 'DELETE', headers: { ...options?.headers, 'If-Match': etag } });
}

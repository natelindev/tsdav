import getLogger from 'debug';
import convert, { ElementCompact } from 'xml-js';

import { DAVNamespace, DAVNamespaceShort } from './consts';
import { DAVDepth, DAVRequest, DAVResponse } from './types/DAVTypes';
import { camelCase } from './util/camelCase';
import { fetch } from './util/fetch';
import { nativeType } from './util/nativeType';
import { cleanupFalsy, excludeHeaders, getDAVAttribute } from './util/requestHelpers';

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

export const davRequest = async (params: {
  url: string;
  init: DAVRequest;
  convertIncoming?: boolean;
  parseOutgoing?: boolean;
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    init,
    convertIncoming = true,
    parseOutgoing = true,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const requestFetch = fetchOverride ?? fetch;
  const { headers = {}, body, namespace, method, attributes } = init;
  const xmlBody = convertIncoming
    ? convert.js2xml(
        {
          _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
          // body is spread AFTER _attributes so a body-level `_attributes`
          // set by the caller wins over the implicit `attributes` param.
          _attributes: attributes,
          ...body,
        },
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
        },
      )
    : body;

  const fetchOptionsWithoutHeaders = {
    ...fetchOptions,
  };
  delete fetchOptionsWithoutHeaders.headers;

  // Merge headers with case-insensitive deduplication. HTTP header names are
  // case-insensitive but plain JS objects aren't, so without normalization a
  // user-supplied `content-type` would coexist with our `Content-Type`,
  // producing undefined provider behavior. Lowercase-keyed map wins, with
  // caller-supplied headers overriding the library defaults.
  const mergedHeaders: Record<string, string> = {};
  const setHeader = (key: string, value: string | undefined): void => {
    if (value == null) return;
    const lower = key.toLowerCase();
    // remove any previously-set entries with a different case
    Object.keys(mergedHeaders).forEach((existing) => {
      if (existing.toLowerCase() === lower) {
        delete mergedHeaders[existing];
      }
    });
    mergedHeaders[key] = value;
  };
  setHeader('Content-Type', 'text/xml;charset=UTF-8');
  Object.entries(cleanupFalsy(headers)).forEach(([k, v]) => setHeader(k, v as string));
  Object.entries(fetchOptions.headers || {}).forEach(([k, v]) => setHeader(k, v as string));

  const davResponse = await requestFetch(url, {
    ...fetchOptionsWithoutHeaders,
    headers: mergedHeaders,
    body: xmlBody,
    method,
  });

  const resText = await davResponse.text();

  // filter out invalid responses
  if (
    !davResponse.ok ||
    !davResponse.headers.get('content-type')?.includes('xml') ||
    !parseOutgoing ||
    !resText
  ) {
    // Cap raw payload size so that non-XML error pages (HTML, stack traces
    // from misconfigured servers) don't blow up downstream error messages or
    // leak the entire response into logs/exceptions.
    const MAX_RAW = 4096;
    const raw = resText.length > MAX_RAW ? `${resText.slice(0, MAX_RAW)}…` : resText;
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw,
      },
    ];
  }

  let result: any;
  try {
    result = convert.xml2js(resText, {
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
          debug((e as Error).stack);
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
  } catch (e) {
    debug(`Failed to parse DAV response XML: ${(e as Error).message}`);
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw: resText,
      },
    ];
  }

  // Non-multistatus XML responses (e.g. a CalDAV error report) would
  // otherwise throw `Cannot read properties of undefined (reading 'response')`.
  // Return the parsed object as raw so callers can inspect it.
  if (!result?.multistatus) {
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw: result,
      },
    ];
  }

  const responseBodies: RawResponse[] = Array.isArray(result.multistatus.response)
    ? result.multistatus.response
    : [result.multistatus.response];

  return responseBodies.map((responseBody) => {
    const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
    if (!responseBody) {
      return {
        status: davResponse.status,
        statusText: davResponse.statusText,
        ok: davResponse.ok,
      };
    }

    const matchArr = statusRegex.exec(responseBody.status);
    const status = matchArr?.groups
      ? Number.parseInt(matchArr.groups.status, 10)
      : davResponse.status;

    return {
      raw: result,
      href: responseBody.href,
      status,
      statusText: matchArr?.groups?.statusText ?? davResponse.statusText,
      // Derive `ok` from the parsed status (per RFC 4918, a 2xx propstat
      // means success). The previous implementation read `!responseBody.error`
      // which flagged empty `<error/>` elements as failures and ignored
      // real non-2xx statuses inside 207 multistatus payloads.
      ok: status >= 200 && status < 300,
      error: responseBody.error,
      responsedescription: responseBody.responsedescription,
      props: (Array.isArray(responseBody.propstat)
        ? responseBody.propstat
        : [responseBody.propstat]
      ).reduce((prev, curr) => {
        return {
          ...prev,
          ...curr?.prop,
        };
      }, {}),
    };
  });
};

export const propfind = async (params: {
  url: string;
  props: ElementCompact;
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
      method: 'PROPFIND',
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: DAVNamespaceShort.DAV,
      body: {
        propfind: {
          _attributes: getDAVAttribute([
            DAVNamespace.CALDAV,
            DAVNamespace.CALDAV_APPLE,
            DAVNamespace.CALENDAR_SERVER,
            DAVNamespace.CARDDAV,
            DAVNamespace.DAV,
          ]),
          prop: props,
        },
      },
    },
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const createObject = async (params: {
  url: string;
  data: BodyInit;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const { url, data, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride ?? fetch;
  return requestFetch(url, {
    method: 'PUT',
    body: data,
    headers: excludeHeaders(headers, headersToExclude),
    ...fetchOptions,
  });
};

export const updateObject = async (params: {
  url: string;
  data: BodyInit;
  etag?: string;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const {
    url,
    data,
    etag,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const requestFetch = fetchOverride ?? fetch;
  return requestFetch(url, {
    method: 'PUT',
    body: data,
    headers: excludeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), headersToExclude),
    ...fetchOptions,
  });
};

export const deleteObject = async (params: {
  url: string;
  etag?: string;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const { url, headers, etag, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride ?? fetch;
  return requestFetch(url, {
    method: 'DELETE',
    headers: excludeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), headersToExclude),
    ...fetchOptions,
  });
};

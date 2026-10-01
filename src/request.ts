import getLogger from 'debug';
import convert, { ElementCompact } from 'xml-js';

import { DAVNamespace, DAVNamespaceShort } from './consts';
import { DAVDepth, DAVPropStat, DAVRequest, DAVResponse } from './types/DAVTypes';
import { fetch } from './util/fetch';
import { mergeDAVProps, parseDAVXML } from './util/xml';
import { cleanupFalsy, excludeHeaders, getDAVAttribute, mergeHeaders } from './util/requestHelpers';

const debug = getLogger('tsdav:request');

type RawProp = {
  prop?: Record<string, any>;
  propNamespaces?: Record<string, string>;
  status?: string;
  error?: Record<string, any>;
  responsedescription?: string;
};
type RawResponse = {
  href: string;
  status?: string;
  ok: boolean;
  error: { [key: string]: any };
  responsedescription: string;
  propstat: RawProp | RawProp[];
};

const parseStatusLine = (
  statusLine?: string,
): { status: number; statusText: string } | undefined => {
  const match = /^\S+\s+(?<status>\d{3})(?:\s+(?<statusText>.*))?$/.exec(statusLine?.trim() ?? '');
  const status = match?.groups?.status;
  const statusText = match?.groups?.statusText;
  return status ? { status: Number.parseInt(status, 10), statusText: statusText ?? '' } : undefined;
};

export const davRequest = async (params: {
  url: string;
  init: DAVRequest;
  convertIncoming?: boolean;
  parseOutgoing?: boolean;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    init,
    convertIncoming = true,
    parseOutgoing = true,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  const requestFetch = fetchOverride ?? fetch;
  const { headers = {}, body, namespace, method, attributes } = init;
  let processedBody = body;
  if (attributes && body != null && typeof body === 'object' && !Array.isArray(body)) {
    processedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const element = value as Record<string, unknown>;
          return [
            key,
            {
              ...element,
              _attributes: {
                ...attributes,
                ...(element._attributes as Record<string, unknown> | undefined),
              },
            },
          ];
        }
        return [key, value];
      }),
    );
  }

  const xmlBody =
    convertIncoming && body != null
      ? convert.js2xml(
          {
            _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
            ...processedBody,
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

  const mergedHeaders = excludeHeaders(
    mergeHeaders(
      { 'Content-Type': 'text/xml;charset=UTF-8' },
      cleanupFalsy(headers),
      fetchOptions.headers,
    ),
    headersToExclude,
  );

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
    !davResponse.headers.get('content-type')?.toLowerCase().includes('xml') ||
    !parseOutgoing ||
    !resText
  ) {
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

  let result: any;
  try {
    result = parseDAVXML(resText);
  } catch (e) {
    debug(`Failed to parse DAV response XML: ${(e as Error).message}`);
    return [
      {
        href: davResponse.url,
        ok: false,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw: resText,
        parseError: (e as Error).message,
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
    if (!responseBody) {
      return {
        raw: result,
        status: davResponse.status,
        statusText: davResponse.statusText,
        ok: davResponse.ok,
      };
    }

    const rawPropStats = Array.isArray(responseBody.propstat)
      ? responseBody.propstat
      : responseBody.propstat
        ? [responseBody.propstat]
        : [];
    const propStats: DAVPropStat[] = rawPropStats.map((stat) => {
      const parsed = parseStatusLine(stat.status);
      const status = parsed?.status ?? 0;
      return {
        props: stat.prop ?? {},
        namespaces: stat.propNamespaces,
        status,
        statusText: parsed?.statusText ?? 'Invalid DAV property status',
        ok: status >= 200 && status < 300,
        error: stat.error,
        responsedescription: stat.responsedescription,
      };
    });
    const failedStatus =
      propStats.length > 0 && propStats.every((stat) => !stat.ok) ? propStats[0] : undefined;
    const parsedStatus = parseStatusLine(responseBody.status) ?? failedStatus;
    const status = parsedStatus?.status ?? davResponse.status;

    return {
      raw: result,
      href: responseBody.href,
      status,
      statusText: parsedStatus?.statusText ?? davResponse.statusText,
      ok: status >= 200 && status < 300,
      error: responseBody.error,
      responsedescription: responseBody.responsedescription,
      propStats,
      props: mergeDAVProps(propStats),
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
    headersToExclude,
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
  const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
  return requestFetch(url, {
    ...fetchOptionsWithoutHeaders,
    method: 'PUT',
    body: data,
    headers: excludeHeaders(mergeHeaders(headers, fetchHeaders), headersToExclude),
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
  const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
  return requestFetch(url, {
    ...fetchOptionsWithoutHeaders,
    method: 'PUT',
    body: data,
    headers: excludeHeaders(
      mergeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), fetchHeaders),
      headersToExclude,
    ),
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
  const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
  return requestFetch(url, {
    ...fetchOptionsWithoutHeaders,
    method: 'DELETE',
    headers: excludeHeaders(
      mergeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), fetchHeaders),
      headersToExclude,
    ),
  });
};

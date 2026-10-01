/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';
import { ElementCompact } from 'xml-js';

import { collectionQuery, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShort } from './consts';
import { createObject, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { DAVAccount, DAVAddressBook, DAVVCard } from './types/models';
import {
  cleanupFalsy,
  excludeHeaders,
  getDAVAttribute,
  urlEquals,
  ensureTrailingSlash,
} from './util/requestHelpers';
import { getDAVUrlKey } from './util/syncHelpers';
import { assertDAVDiscovery, assertDAVObjectResponses, getDAVText } from './util/responseHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelpers';

const debug = getLogger('tsdav:addressBook');

export const addressBookQuery = async (params: {
  url: string;
  props: ElementCompact;
  filters?: ElementCompact;
  depth?: DAVDepth;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    props,
    filters,
    depth,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  return collectionQuery({
    url,
    body: {
      'addressbook-query': cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        filter: filters ?? {
          'prop-filter': {
            _attributes: {
              name: 'FN',
            },
          },
        },
      }),
    },
    defaultNamespace: DAVNamespaceShort.CARDDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const addressBookMultiGet = async (params: {
  url: string;
  props: ElementCompact;
  objectUrls: string[];
  depth: DAVDepth;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVResponse[]> => {
  const {
    url,
    props,
    objectUrls,
    depth,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  return collectionQuery({
    url,
    body: {
      'addressbook-multiget': cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CARDDAV]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        [`${DAVNamespaceShort.DAV}:href`]: objectUrls,
      }),
    },
    defaultNamespace: DAVNamespaceShort.CARDDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const fetchAddressBooks = async (params?: {
  account?: DAVAccount;
  props?: ElementCompact;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVAddressBook[]> => {
  const {
    account,
    headers,
    props: customProps,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params ?? {};
  const requiredFields: Array<keyof DAVAccount> = ['homeUrl', 'rootUrl'];
  if (!account || !hasFields(account, requiredFields)) {
    if (!account) {
      throw new Error('no account for fetchAddressBooks');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        account,
        requiredFields,
      )} before fetchAddressBooks`,
    );
  }
  const res = await propfind({
    url: account.homeUrl,
    props: {
      ...(customProps ?? {
        [`${DAVNamespaceShort.DAV}:displayname`]: {},
        [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
        [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
        [`${DAVNamespaceShort.DAV}:sync-token`]: {},
      }),
      [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
    },
    depth: '1',
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
  assertDAVDiscovery(res, 'Address book discovery failed');

  return Promise.all(
    res
      .filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes('addressbook'))
      .map((rs) => {
        const displayName = rs.props?.displayname?._cdata ?? rs.props?.displayname;
        debug(`Found address book named ${typeof displayName === 'string' ? displayName : ''},
             props: ${JSON.stringify(rs.props)}`);
        return {
          url: new URL(rs.href ?? '', ensureTrailingSlash(account.rootUrl ?? '')).href,
          ctag: getDAVText(rs.props?.getctag),
          displayName: typeof displayName === 'string' ? displayName : '',
          resourcetype: Object.keys(rs.props?.resourcetype ?? {}),
          syncToken: getDAVText(rs.props?.syncToken),
        };
      })
      .map(async (addr) => ({
        ...addr,
        reports: await supportedReportSet({
          collection: addr,
          headers: excludeHeaders(headers, headersToExclude),
          headersToExclude,
          fetchOptions,
          fetch: fetchOverride,
        }),
      })),
  );
};

export const fetchVCards = async (params: {
  addressBook: DAVAddressBook;
  headers?: Record<string, string>;
  objectUrls?: string[];
  urlFilter?: (url: string) => boolean;
  useMultiGet?: boolean;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<DAVVCard[]> => {
  const {
    addressBook,
    headers,
    objectUrls,
    headersToExclude,
    urlFilter = (url) => Boolean(url),
    useMultiGet = true,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  debug(`Fetching vcards from ${addressBook?.url}`);
  const requiredFields: Array<'url'> = ['url'];
  if (!addressBook || !hasFields(addressBook, requiredFields)) {
    if (!addressBook) {
      throw new Error('cannot fetchVCards for undefined addressBook');
    }
    throw new Error(
      `addressBook must have ${findMissingFieldNames(
        addressBook,
        requiredFields,
      )} before fetchVCards`,
    );
  }

  const vcardUrls = (
    objectUrls ??
    // fetch all objects of the calendar
    (
      await addressBookQuery({
        url: addressBook.url,
        props: { [`${DAVNamespaceShort.DAV}:getetag`]: {} },
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        headersToExclude,
        fetchOptions,
        fetch: fetchOverride,
      })
    ).map((res) => res.href ?? '')
  )
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) =>
      url.startsWith('http') ? url : new URL(url, ensureTrailingSlash(addressBook.url)).href,
    )
    .filter((url) => !urlEquals(url, addressBook.url))
    .filter(urlFilter)
    .map((url) => {
      const parsedUrl = new URL(url);
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    });

  const targetUrls = new Set(vcardUrls.map((url) => getDAVUrlKey(url, addressBook.url)));
  let vCardResults: DAVResponse[] = [];
  if (vcardUrls.length > 0) {
    if (useMultiGet) {
      vCardResults = await addressBookMultiGet({
        url: addressBook.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CARDDAV}:address-data`]: {},
        },
        objectUrls: vcardUrls,
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        headersToExclude,
        fetchOptions,
        fetch: fetchOverride,
      });
    } else {
      vCardResults = await addressBookQuery({
        url: addressBook.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CARDDAV}:address-data`]: {},
        },
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        headersToExclude,
        fetchOptions,
        fetch: fetchOverride,
      });
      vCardResults = vCardResults.filter(
        (res) => !!res.href && targetUrls.has(getDAVUrlKey(res.href, addressBook.url)),
      );
    }
  }

  assertDAVObjectResponses(
    vCardResults,
    'addressData',
    vcardUrls,
    addressBook.url,
    'VCard fetch failed',
  );
  return vCardResults.map((res) => ({
    url: new URL(res.href ?? '', ensureTrailingSlash(addressBook.url)).href,
    etag: getDAVText(res.props?.getetag),
    data: res.props?.addressData?._cdata ?? res.props?.addressData,
  }));
};

export const createVCard = async (params: {
  addressBook: DAVAddressBook;
  vCardString: string;
  filename: string;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const {
    addressBook,
    vCardString,
    filename,
    headers,
    headersToExclude,
    fetchOptions = {},
    fetch: fetchOverride,
  } = params;
  return createObject({
    url: new URL(filename, ensureTrailingSlash(addressBook.url)).href,
    data: vCardString,
    headers: excludeHeaders(
      {
        'content-type': 'text/vcard; charset=utf-8',
        'If-None-Match': '*',
        ...headers,
      },
      headersToExclude,
    ),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const updateVCard = async (params: {
  vCard: DAVVCard;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return updateObject({
    url: vCard.url,
    data: vCard.data,
    etag: vCard.etag,
    headers: excludeHeaders(
      {
        'content-type': 'text/vcard; charset=utf-8',
        ...headers,
      },
      headersToExclude,
    ),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

export const deleteVCard = async (params: {
  vCard: DAVVCard;
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
}): Promise<Response> => {
  const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return deleteObject({
    url: vCard.url,
    etag: vCard.etag,
    headers: excludeHeaders(headers, headersToExclude),
    headersToExclude,
    fetchOptions,
    fetch: fetchOverride,
  });
};

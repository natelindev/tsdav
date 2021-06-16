/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';

import { collectionQuery, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { createObject, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVFilter, DAVProp, DAVResponse } from './types/DAVTypes';
import { DAVAccount, DAVAddressBook, DAVVCard } from './types/models';
import { formatFilters, formatProps, getDAVAttribute } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelper';

const debug = getLogger('tsdav:addressBook');

export const addressBookQuery = async (params: {
  url: string;
  props: DAVProp[];
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, depth, headers } = params;
  return collectionQuery({
    url,
    body: {
      'addressbook-query': {
        _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        filter: {
          'prop-filter': {
            _attributes: {
              name: 'FN',
            },
          },
        },
      },
    },
    defaultNamespace: DAVNamespace.CARDDAV,
    depth,
    headers,
  });
};

export const addressBookMultiGet = async (params: {
  url: string;
  props: DAVProp[];
  objectUrls: string[];
  filters?: DAVFilter[];
  depth: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, objectUrls, filters, depth, headers } = params;
  return collectionQuery({
    url,
    body: {
      'addressbook-multiget': {
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CARDDAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:href`]: objectUrls,
        filter: formatFilters(filters),
      },
    },
    defaultNamespace: DAVNamespace.CARDDAV,
    depth,
    headers,
  });
};

export const fetchAddressBooks = async (params?: {
  headers?: Record<string, string>;
  account?: DAVAccount;
}): Promise<DAVAddressBook[]> => {
  const { account, headers } = params ?? {};
  const requiredFields: Array<keyof DAVAccount> = ['homeUrl', 'rootUrl'];
  if (!account || !hasFields(account, requiredFields)) {
    if (!account) {
      throw new Error('no account for fetchAddressBooks');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(account, requiredFields)} before fetchAddressBooks`
    );
  }
  const res = await propfind({
    url: account.homeUrl,
    props: [
      { name: 'displayname', namespace: DAVNamespace.DAV },
      { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: DAVNamespace.DAV },
      { name: 'sync-token', namespace: DAVNamespace.DAV },
    ],
    depth: '1',
    headers,
  });
  return Promise.all(
    res
      .filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes('addressbook'))
      .map((rs) => {
        const displayName = rs.props?.displayname;
        debug(`Found address book named ${typeof displayName === 'string' ? displayName : ''},
             props: ${JSON.stringify(rs.props)}`);
        return {
          url: new URL(rs.href ?? '', account.rootUrl ?? '').href,
          ctag: rs.props?.getctag,
          displayName: typeof displayName === 'string' ? displayName : '',
          resourcetype: Object.keys(rs.props?.resourcetype),
          syncToken: rs.props?.syncToken,
        };
      })
      .map(async (addr) => ({
        ...addr,
        reports: await supportedReportSet({ collection: addr, headers }),
      }))
  );
};

export const fetchVCards = async (params: {
  addressBook: DAVAddressBook;
  headers?: Record<string, string>;
  objectUrls?: string[];
}): Promise<DAVVCard[]> => {
  const { addressBook, headers, objectUrls } = params;
  debug(`Fetching vcards from ${addressBook?.url}`);
  const requiredFields: Array<'url'> = ['url'];
  if (!addressBook || !hasFields(addressBook, requiredFields)) {
    if (!addressBook) {
      throw new Error('cannot fetchVCards for undefined addressBook');
    }
    throw new Error(
      `addressBook must have ${findMissingFieldNames(
        addressBook,
        requiredFields
      )} before fetchVCards`
    );
  }

  const vcardUrls = (
    objectUrls ??
    // fetch all objects of the calendar
    (
      await addressBookQuery({
        url: addressBook.url,
        props: [{ name: 'getetag', namespace: DAVNamespace.DAV }],
        depth: '1',
        headers,
      })
    ).map((res) => res.href ?? '')
  )
    .map((url) => (url.includes('http') ? url : new URL(url, addressBook.url).href))
    .map((url) => new URL(url).pathname)
    .filter((url): url is string => Boolean(url?.includes('.vcf')));

  const vCardResults = await addressBookMultiGet({
    url: addressBook.url,
    props: [
      { name: 'getetag', namespace: DAVNamespace.DAV },
      { name: 'address-data', namespace: DAVNamespace.CARDDAV },
    ],
    objectUrls: vcardUrls,
    depth: '1',
    headers,
  });

  return vCardResults.map((res) => ({
    url: new URL(res.href ?? '', addressBook.url).href,
    etag: res.props?.getetag,
    data: res.props?.addressData?._cdata ?? res.props?.addressData,
  }));
};

export const createVCard = async (params: {
  addressBook: DAVAddressBook;
  vCardString: string;
  filename: string;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { addressBook, vCardString, filename, headers } = params;
  return createObject({
    url: new URL(filename, addressBook.url).href,
    data: vCardString,
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      ...headers,
    },
  });
};

export const updateVCard = async (params: {
  vCard: DAVVCard;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { vCard, headers } = params;
  return updateObject({
    url: vCard.url,
    data: vCard.data,
    etag: vCard.etag,
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      ...headers,
    },
  });
};

export const deleteVCard = async (params: {
  vCard: DAVVCard;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { vCard, headers } = params;
  return deleteObject({
    url: vCard.url,
    etag: vCard.etag,
    headers,
  });
};

import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  addressBookMultiGet,
  addressBookQuery,
  createVCard,
  deleteVCard,
  fetchAddressBooks,
  fetchVCards,
  updateVCard,
} from '../../addressBook';
import * as request from '../../request';
import * as collection from '../../collection';

vi.mock('../../request');
vi.mock('../../collection');

const _mockedDavRequest = request.davRequest as vi.MockedFunction<typeof request.davRequest>;
const mockedPropfind = request.propfind as vi.MockedFunction<typeof request.propfind>;
const mockedCreateObject = request.createObject as vi.MockedFunction<typeof request.createObject>;
const mockedUpdateObject = request.updateObject as vi.MockedFunction<typeof request.updateObject>;
const mockedDeleteObject = request.deleteObject as vi.MockedFunction<typeof request.deleteObject>;
const mockedCollectionQuery = collection.collectionQuery as vi.MockedFunction<
  typeof collection.collectionQuery
>;
const mockedSupportedReportSet = collection.supportedReportSet as vi.MockedFunction<
  typeof collection.supportedReportSet
>;

describe('fetchVCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle Radicale responses with valid href', async () => {
    // PROPFIND listing returns URLs
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
        },
      },
    ]);

    // addressBookMultiGet returns data
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          addressData: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEND:VCARD',
        },
      },
    ]);

    const vcards = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(vcards).toHaveLength(1);
    expect(vcards[0].url).toContain('card1.vcf');
    expect(mockedPropfind).toHaveBeenCalledTimes(1);
    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
  });

  it('should filter out the address book collection itself if returned in the listing', async () => {
    // PROPFIND listing returns URLs including the collection
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          resourcetype: { addressbook: {}, collection: {} },
        },
      },
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
        },
      },
    ]);

    // addressBookMultiGet returns data
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          addressData: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEND:VCARD',
        },
      },
    ]);

    const vcards = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(vcards).toHaveLength(1);
    expect(vcards[0].url).toContain('card1.vcf');
    expect(vcards[0].url).not.toBe('http://example.com/user/addr/');

    // Check that multi-get was called ONLY with the vcard URL, not the collection URL
    const multiGetCall = mockedCollectionQuery.mock.calls[0][0];
    const hrefs = multiGetCall.body['addressbook-multiget']['d:href'];
    expect(hrefs).toEqual(['/user/addr/card1.vcf']);
  });

  it('should throw when addressBook is undefined', async () => {
    await expect(fetchVCards({ addressBook: undefined as any })).rejects.toThrow(
      'cannot fetchVCards for undefined addressBook',
    );
  });

  it('should throw when addressBook has no url', async () => {
    await expect(fetchVCards({ addressBook: {} as any })).rejects.toThrow(
      'addressBook must have url before fetchVCards',
    );
  });

  it('should use addressBookQuery when useMultiGet is false', async () => {
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"' },
      },
    ]);
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"', addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    const result = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
      useMultiGet: false,
    });

    expect(result).toHaveLength(1);
    expect(result[0].data).toBe('BEGIN:VCARD\nEND:VCARD');
  });

  it('should return empty when no vcard URLs match', async () => {
    mockedPropfind.mockResolvedValueOnce([]);

    const result = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(result).toHaveLength(0);
  });

  it('should preserve query strings in multiget hrefs', async () => {
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf?revision=2',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
      objectUrls: ['http://example.com/user/addr/card1.vcf?revision=2'],
    });

    expect(mockedCollectionQuery.mock.calls[0][0].body['addressbook-multiget']['d:href']).toEqual([
      '/user/addr/card1.vcf?revision=2',
    ]);
  });

  it('should use _cdata when present in addressData', async () => {
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"' },
      },
    ]);
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"', addressData: { _cdata: 'BEGIN:VCARD\nCDATA\nEND:VCARD' } },
      },
    ]);

    const result = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(result[0].data).toBe('BEGIN:VCARD\nCDATA\nEND:VCARD');
  });

  it('should leave a missing ETag undefined', async () => {
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    const result = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
      objectUrls: ['/user/addr/card1.vcf'],
    });

    expect(result[0].etag).toBeUndefined();
  });

  it('should list vcards with PROPFIND depth 1 and skip collections', async () => {
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { resourcetype: { collection: {}, addressbook: {} } },
      },
      {
        href: '/user/addr/sub/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { resourcetype: { collection: {} } },
      },
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"', resourcetype: {} },
      },
    ]);
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"', addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    const result = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('http://example.com/user/addr/card1.vcf');
    expect(mockedPropfind).toHaveBeenCalledTimes(1);
    expect(mockedPropfind.mock.calls[0][0]).toMatchObject({
      url: 'http://example.com/user/addr/',
      depth: '1',
      props: { 'd:getetag': {}, 'd:resourcetype': {} },
    });
    expect(mockedCollectionQuery.mock.calls[0][0].body['addressbook-multiget']['d:href']).toEqual([
      '/user/addr/card1.vcf',
    ]);
  });

  it('should not send an addressbook-query to list vcards', async () => {
    // OX App Suite (mailbox.org) answers the default FN prop-filter query with an empty multistatus
    mockedPropfind.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"' },
      },
    ]);
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"', addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    await fetchVCards({ addressBook: { url: 'http://example.com/user/addr/' } });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
    expect(mockedCollectionQuery.mock.calls[0][0].body).not.toHaveProperty('addressbook-query');
  });

  it('should not list the address book when objectUrls are given', async () => {
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"', addressData: 'BEGIN:VCARD\nEND:VCARD' },
      },
    ]);

    await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
      objectUrls: ['/user/addr/card1.vcf'],
    });

    expect(mockedPropfind).not.toHaveBeenCalled();
  });
});

describe('addressBookQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call collectionQuery with addressbook-query body', async () => {
    mockedCollectionQuery.mockResolvedValue([
      { href: '/addr/card.vcf', ok: true, status: 200, statusText: 'OK', props: {} },
    ]);

    const result = await addressBookQuery({
      url: 'http://example.com/addr/',
      props: { 'd:getetag': {} },
    });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
    const callBody = mockedCollectionQuery.mock.calls[0][0].body;
    expect(callBody).toHaveProperty('addressbook-query');
    expect(result).toHaveLength(1);
  });
});

describe('addressBookMultiGet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call collectionQuery with addressbook-multiget body', async () => {
    mockedCollectionQuery.mockResolvedValue([
      { href: '/addr/card.vcf', ok: true, status: 200, statusText: 'OK', props: {} },
    ]);

    const result = await addressBookMultiGet({
      url: 'http://example.com/addr/',
      props: { 'd:getetag': {} },
      objectUrls: ['/addr/card.vcf'],
      depth: '1',
    });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
    const callBody = mockedCollectionQuery.mock.calls[0][0].body;
    expect(callBody).toHaveProperty('addressbook-multiget');
    expect(result).toHaveLength(1);
  });
});

describe('fetchAddressBooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should throw when no account is provided', async () => {
    await expect(fetchAddressBooks()).rejects.toThrow('no account for fetchAddressBooks');
  });

  it('should throw when account is missing required fields', async () => {
    await expect(
      fetchAddressBooks({
        account: { serverUrl: 'https://example.com/', accountType: 'carddav' },
      }),
    ).rejects.toThrow('account must have homeUrl,rootUrl before fetchAddressBooks');
  });

  it('should fetch and parse address books', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/addr/default/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Contacts',
          resourcetype: { addressbook: {}, collection: {} },
          getctag: 'ctag1',
          syncToken: 'sync1',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue(['syncCollection']);

    const result = await fetchAddressBooks({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/addr/',
        rootUrl: 'https://example.com/',
        accountType: 'carddav',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Contacts');
    expect(result[0].ctag).toBe('ctag1');
  });

  it('should filter out non-addressbook resources', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/addr/default/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Contacts',
          resourcetype: { addressbook: {}, collection: {} },
          getctag: 'c1',
        },
      },
      {
        href: '/addr/other/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Not Addressbook',
          resourcetype: { collection: {} },
          getctag: 'c2',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await fetchAddressBooks({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/addr/',
        rootUrl: 'https://example.com/',
        accountType: 'carddav',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Contacts');
  });
});

describe('createVCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call createObject with correct params', async () => {
    mockedCreateObject.mockResolvedValue({ ok: true, status: 201 } as any);

    await createVCard({
      addressBook: { url: 'http://example.com/addr/' },
      vCardString: 'BEGIN:VCARD\nFN:Test\nEND:VCARD',
      filename: 'contact.vcf',
    });

    expect(mockedCreateObject).toHaveBeenCalledTimes(1);
    const args = mockedCreateObject.mock.calls[0][0];
    expect(args.url).toBe('http://example.com/addr/contact.vcf');
    expect(args.data).toBe('BEGIN:VCARD\nFN:Test\nEND:VCARD');
    expect(args.headers?.['content-type']).toBe('text/vcard; charset=utf-8');
    expect(args.headers?.['If-None-Match']).toBe('*');
  });

  it('should keep a filename with URL syntax inside the address book', async () => {
    mockedCreateObject.mockResolvedValue({ ok: true, status: 201 } as any);

    await createVCard({
      addressBook: { url: 'http://example.com/addr/' },
      vCardString: 'BEGIN:VCARD\nFN:Test\nEND:VCARD',
      filename: 'urn:uuid:7?v=2.vcf',
    });

    expect(mockedCreateObject.mock.calls[0][0].url).toBe(
      'http://example.com/addr/urn:uuid:7%3Fv=2.vcf',
    );
    await expect(
      createVCard({
        addressBook: { url: 'http://example.com/addr/' },
        vCardString: 'BEGIN:VCARD\nFN:Test\nEND:VCARD',
        filename: '/root.vcf',
      }),
    ).rejects.toThrow('Invalid object filename');
  });
});

describe('updateVCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call updateObject with etag', async () => {
    mockedUpdateObject.mockResolvedValue({ ok: true, status: 200 } as any);

    await updateVCard({
      vCard: {
        url: 'http://example.com/addr/card.vcf',
        etag: '"etag1"',
        data: 'updated-vcard',
      },
    });

    expect(mockedUpdateObject).toHaveBeenCalledTimes(1);
    const args = mockedUpdateObject.mock.calls[0][0];
    expect(args.url).toBe('http://example.com/addr/card.vcf');
    expect(args.etag).toBe('"etag1"');
  });
});

describe('deleteVCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call deleteObject with etag', async () => {
    mockedDeleteObject.mockResolvedValue({ ok: true, status: 204 } as any);

    await deleteVCard({
      vCard: {
        url: 'http://example.com/addr/card.vcf',
        etag: '"etag1"',
      },
    });

    expect(mockedDeleteObject).toHaveBeenCalledTimes(1);
    const args = mockedDeleteObject.mock.calls[0][0];
    expect(args.url).toBe('http://example.com/addr/card.vcf');
    expect(args.etag).toBe('"etag1"');
  });
});

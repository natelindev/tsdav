import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import {
  collectionQuery,
  isCollectionDirty,
  makeCollection,
  smartCollectionSync,
  supportedReportSet,
  syncCollection,
} from '../../collection';
import * as request from '../../request';

vi.mock('../../request');

const mockedDavRequest = request.davRequest as vi.MockedFunction<typeof request.davRequest>;
const mockedPropfind = request.propfind as vi.MockedFunction<typeof request.propfind>;

describe('collectionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when davRequest returns a 504 error', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 504,
        statusText: 'Gateway Time-out',
        raw: '<html>Gateway Time-out</html>',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 504 Gateway Time-out');
  });

  it('should throw error when davRequest returns a 504 error and empty raw', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 504,
        statusText: 'Gateway Time-out',
        raw: '',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 504 Gateway Time-out');
  });

  it('should throw error when davRequest returns a 401 error', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        raw: 'Unauthorized',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 401 Unauthorized');
  });

  it('should return empty array when queryResults.length === 1, !queryResults[0].raw and status is 200', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: true,
        status: 200,
        statusText: 'OK',
      },
    ]);

    const result = await collectionQuery({
      url: 'http://example.com/cal/',
      body: {},
    });

    expect(result).toEqual([]);
  });

  it('should NOT return empty array when status is >= 400 even if !raw', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: true, // Suppose ok is true but status is 400 (unlikely but testing the logic)
        status: 400,
        statusText: 'Bad Request',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 400 Bad Request');
  });

  it('should return results for successful multi-status response', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/event1.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"123"' },
      },
      {
        href: 'http://example.com/cal/event2.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"456"' },
      },
    ]);

    const result = await collectionQuery({
      url: 'http://example.com/cal/',
      body: {},
    });

    expect(result).toHaveLength(2);
    expect(result[0].props?.getetag).toBe('"123"');
    expect(result[1].props?.getetag).toBe('"456"');
  });
});

describe('makeCollection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call davRequest with MKCOL method and props', async () => {
    mockedDavRequest.mockResolvedValue([
      { href: 'http://example.com/col/', ok: true, status: 201, statusText: 'Created' },
    ]);

    const result = await makeCollection({
      url: 'http://example.com/col/',
      props: { 'd:displayname': 'New Collection' },
    });

    expect(mockedDavRequest).toHaveBeenCalledTimes(1);
    expect(mockedDavRequest.mock.calls[0][0].init.method).toBe('MKCOL');
    const body = mockedDavRequest.mock.calls[0][0].init.body as any;
    expect(body.mkcol.set.prop).toEqual({ 'd:displayname': 'New Collection' });
    expect(result).toHaveLength(1);
  });

  it('should call davRequest with MKCOL method without body when no props', async () => {
    mockedDavRequest.mockResolvedValue([
      { href: 'http://example.com/col/', ok: true, status: 201, statusText: 'Created' },
    ]);

    await makeCollection({ url: 'http://example.com/col/' });

    const body = mockedDavRequest.mock.calls[0][0].init.body;
    expect(body).toBeUndefined();
  });
});

describe('supportedReportSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return report names from propfind response', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          supportedReportSet: {
            supportedReport: [
              { report: { syncCollection: {} } },
              { report: { calendarMultiget: {} } },
            ],
          },
        },
      },
    ]);

    const result = await supportedReportSet({
      collection: { url: 'http://example.com/col/' },
    });

    expect(result).toEqual(['syncCollection', 'calendarMultiget']);
  });

  it('should return empty array when no supported reports', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {},
      },
    ]);

    const result = await supportedReportSet({
      collection: { url: 'http://example.com/col/' },
    });

    expect(result).toEqual([]);
  });

  // Regression: xml-js compact output collapses a single `<supported-report>`
  // element into a plain object (not a one-element array). Before this fix,
  // `.map` would crash with "map is not a function" against a valid 207
  // response from servers that advertise exactly one report.
  it('should handle a single supported-report parsed as an object', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          supportedReportSet: {
            supportedReport: { report: { syncCollection: {} } },
          },
        },
      },
    ]);

    const result = await supportedReportSet({
      collection: { url: 'http://example.com/col/' },
    });

    expect(result).toEqual(['syncCollection']);
  });

  it('should skip malformed supported-report entries without a report key', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          supportedReportSet: {
            // Some servers return entries where `report` is missing or empty.
            supportedReport: [
              { report: { syncCollection: {} } },
              { report: {} },
              {},
            ],
          },
        },
      },
    ]);

    const result = await supportedReportSet({
      collection: { url: 'http://example.com/col/' },
    });

    expect(result).toEqual(['syncCollection']);
  });
});

describe('isCollectionDirty', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return isDirty=true when ctag differs', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const result = await isCollectionDirty({
      collection: { url: 'http://example.com/col/', ctag: 'old-ctag' },
    });

    expect(result.isDirty).toBe(true);
    expect(result.newCtag).toBe('new-ctag');
  });

  it('should return isDirty=false when ctag matches', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'same-ctag' },
      },
    ]);

    const result = await isCollectionDirty({
      collection: { url: 'http://example.com/col/', ctag: 'same-ctag' },
    });

    expect(result.isDirty).toBe(false);
  });

  it('should throw when collection does not exist on server', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/other/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'ctag' },
      },
    ]);

    await expect(
      isCollectionDirty({
        collection: { url: 'http://example.com/missing/' },
      }),
    ).rejects.toThrow('Collection does not exist on server');
  });
});

describe('syncCollection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call davRequest with REPORT method and sync-collection body', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/item.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"1"' },
      },
    ]);

    const result = await syncCollection({
      url: 'http://example.com/col/',
      props: { 'd:getetag': {} },
      syncLevel: 1,
      syncToken: 'token-123',
    });

    expect(mockedDavRequest).toHaveBeenCalledTimes(1);
    const body = mockedDavRequest.mock.calls[0][0].init.body as any;
    expect(body['sync-collection']['sync-token']).toBe('token-123');
    expect(body['sync-collection']['sync-level']).toBe(1);
    expect(result).toHaveLength(1);
  });
});

describe('smartCollectionSync', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should throw when account is not provided', async () => {
    await expect(
      smartCollectionSync({
        collection: { url: 'http://example.com/col/' },
      } as any),
    ).rejects.toThrow('no account for smartCollectionSync');
  });

  it('should throw when account is missing required fields', async () => {
    await expect(
      smartCollectionSync({
        collection: { url: 'http://example.com/col/' },
        account: { serverUrl: 'https://example.com/' },
      } as any),
    ).rejects.toThrow('account must have accountType,homeUrl before smartCollectionSync');
  });

  it('should use webdav method when collection reports include syncCollection', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/item.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"new-etag"', calendarData: 'ical-data' },
        raw: { multistatus: { syncToken: 'new-token' } },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'old-token',
        objects: [],
        objectMultiGet: vi.fn().mockResolvedValue([
          {
            href: '/col/item.ics',
            ok: true,
            status: 200,
            statusText: 'OK',
            props: { getetag: '"new-etag"', calendarData: 'ical-data' },
          },
        ]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.created).toHaveLength(1);
    expect(result.objects.deleted).toHaveLength(0);
    expect(result.syncToken).toBe('new-token');
  });

  // Regression: the basic/ctag fallback used to call `collection.fetchObjects`
  // with only `{ collection, headers, fetchOptions }`, silently dropping any
  // `fetch` override supplied by the caller. That broke custom transports
  // (Electron, KaiOS, Workers) in fallback sync mode.
  it('should forward the fetch override to collection.fetchObjects in basic mode', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const customFetch = vi.fn();
    const mockFetchObjects = vi.fn().mockResolvedValue([]);

    await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'old-ctag',
        objects: [],
        fetchObjects: mockFetchObjects,
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      fetch: customFetch as any,
      detailedResult: true,
    });

    expect(mockFetchObjects).toHaveBeenCalledTimes(1);
    expect(mockFetchObjects.mock.calls[0][0].fetch).toBe(customFetch);
  });

  it('should use basic method when collection reports do not include syncCollection', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const mockFetchObjects = vi.fn().mockResolvedValue([
      { url: 'http://example.com/col/item.ics', etag: '"1"', data: 'ical-data' },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'old-ctag',
        objects: [],
        fetchObjects: mockFetchObjects,
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.created).toHaveLength(1);
    expect(result.ctag).toBe('new-ctag');
  });

  it('should detect deleted objects in webdav mode (404 status)', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/deleted.ics',
        ok: false,
        status: 404,
        statusText: 'Not Found',
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'token',
        objects: [{ url: 'http://example.com/col/deleted.ics', etag: '"old"' }],
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.deleted).toHaveLength(1);
    expect(result.objects.deleted[0].url).toContain('deleted.ics');
  });

  it('should detect updated objects in basic mode', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const mockFetchObjects = vi.fn().mockResolvedValue([
      { url: 'http://example.com/col/item.ics', etag: '"new-etag"', data: 'updated' },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'old-ctag',
        objects: [{ url: 'http://example.com/col/item.ics', etag: '"old-etag"' }],
        fetchObjects: mockFetchObjects,
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.updated).toHaveLength(1);
    expect(result.objects.updated[0].etag).toBe('"new-etag"');
  });

  it('should return unchanged collection when basic method finds isDirty=false', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'same-ctag' },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'same-ctag',
        objects: [{ url: 'http://example.com/col/item.ics', etag: '"1"' }],
        fetchObjects: vi.fn().mockResolvedValue([]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.created).toHaveLength(0);
    expect(result.objects.updated).toHaveLength(0);
    expect(result.objects.deleted).toHaveLength(0);
  });

  it('should return merged objects when detailedResult is false', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const mockFetchObjects = vi.fn().mockResolvedValue([
      { url: 'http://example.com/col/item1.ics', etag: '"1"', data: 'data1' },
      { url: 'http://example.com/col/item2.ics', etag: '"2"', data: 'data2' },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'old-ctag',
        objects: [],
        fetchObjects: mockFetchObjects,
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: false,
    });

    expect(Array.isArray(result.objects)).toBe(true);
    expect(result.objects).toHaveLength(2);
  });

  it('should use carddav data fields in webdav mode', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/card.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"v1"', addressData: { _cdata: 'BEGIN:VCARD\nEND:VCARD' } },
        raw: { multistatus: { syncToken: 'new-token' } },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'old-token',
        objects: [],
        objectMultiGet: vi.fn().mockResolvedValue([
          {
            href: '/col/card.vcf',
            ok: true,
            status: 200,
            statusText: 'OK',
            props: { getetag: '"v1"', addressData: { _cdata: 'BEGIN:VCARD\nEND:VCARD' } },
          },
        ]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'carddav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.created).toHaveLength(1);
    expect(result.objects.created[0].data).toBe('BEGIN:VCARD\nEND:VCARD');
  });

  it('should use webdav mode with detailedResult=false (returns merged objects)', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/item.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"e1"', calendarData: 'data' },
        raw: { multistatus: { syncToken: 'token2' } },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'token1',
        objects: [],
        objectMultiGet: vi.fn().mockResolvedValue([
          {
            href: '/col/item.ics',
            ok: true,
            status: 200,
            statusText: 'OK',
            props: { getetag: '"e1"', calendarData: 'data' },
          },
        ]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: false,
    });

    expect(Array.isArray(result.objects)).toBe(true);
  });

  it('should detect deleted objects in basic mode', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'new-ctag' },
      },
    ]);

    const mockFetchObjects = vi.fn().mockResolvedValue([]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: [],
        ctag: 'old-ctag',
        objects: [{ url: 'http://example.com/col/item.ics', etag: '"1"' }],
        fetchObjects: mockFetchObjects,
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.deleted).toHaveLength(1);
    expect(result.objects.created).toHaveLength(0);
  });

  it('should fall back to basic when reports is undefined', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'same-ctag' },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        ctag: 'same-ctag',
        objects: [],
        fetchObjects: vi.fn().mockResolvedValue([]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: false,
    });

    // unchanged collection returned when not dirty
    expect(result.url).toBe('http://example.com/col/');
  });

  it('should use explicit method override', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: 'http://example.com/col/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getctag: 'same-ctag' },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        ctag: 'same-ctag',
        objects: [],
        fetchObjects: vi.fn().mockResolvedValue([]),
      } as any,
      method: 'basic',
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: false,
    });

    expect(result.url).toBe('http://example.com/col/');
  });

  it('should handle webdav with no changedObjectUrls (only deletions)', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/old.ics',
        ok: false,
        status: 404,
        statusText: 'Not Found',
        raw: { multistatus: { syncToken: 'token3' } },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'token2',
        objects: [{ url: 'http://example.com/col/old.ics', etag: '"e1"' }],
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.deleted).toHaveLength(1);
    expect(result.objects.created).toHaveLength(0);
  });

  it('should identify updated objects in webdav mode', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: '/col/item.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { getetag: '"new-etag"', calendarData: 'updated-data' },
        raw: { multistatus: { syncToken: 'token2' } },
      },
    ]);

    const result = await smartCollectionSync({
      collection: {
        url: 'http://example.com/col/',
        reports: ['syncCollection'],
        syncToken: 'token1',
        objects: [{ url: 'http://example.com/col/item.ics', etag: '"old-etag"' }],
        objectMultiGet: vi.fn().mockResolvedValue([
          {
            href: '/col/item.ics',
            ok: true,
            status: 200,
            statusText: 'OK',
            props: { getetag: '"new-etag"', calendarData: 'updated-data' },
          },
        ]),
      } as any,
      account: {
        serverUrl: 'https://example.com/',
        accountType: 'caldav',
        homeUrl: 'https://example.com/col/',
      },
      detailedResult: true,
    });

    expect(result.objects.updated).toHaveLength(1);
    expect(result.objects.updated[0].etag).toBe('"new-etag"');
    expect(result.objects.created).toHaveLength(0);
  });
});

import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import {
  calendarMultiGet,
  calendarQuery,
  createCalendarObject,
  deleteCalendarObject,
  fetchCalendarObjects,
  fetchCalendarUserAddresses,
  fetchCalendars,
  freeBusyQuery,
  makeCalendar,
  syncCalendars,
  syncCalendarsDetailed,
  updateCalendarObject,
} from '../../calendar';
import * as request from '../../request';
import * as collection from '../../collection';
import { DAVNamespaceShort } from '../../consts';

vi.mock('../../request');
vi.mock('../../collection');

const mockedDavRequest = request.davRequest as vi.MockedFunction<typeof request.davRequest>;
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
const mockedSmartCollectionSync = collection.smartCollectionSync as vi.MockedFunction<
  typeof collection.smartCollectionSync
>;

describe('fetchCalendarObjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly place expand under calendar-data in the initial query', async () => {
    mockedCollectionQuery.mockResolvedValue([
      {
        href: '/cal/event.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          calendarData: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
        },
      },
    ]);

    await fetchCalendarObjects({
      calendar: { url: 'http://example.com/cal/' },
      timeRange: { start: '2022-01-01T00:00:00Z', end: '2022-01-02T00:00:00Z' },
      expand: true,
    });

    // There should be only one call now because of the optimization
    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);

    const call = mockedCollectionQuery.mock.calls[0];
    const body = call[0].body as any;
    const props = body['calendar-query'][`${DAVNamespaceShort.DAV}:prop`];

    // Check that expand is a child of calendar-data and NOT getetag
    expect(props).toHaveProperty([
      `${DAVNamespaceShort.CALDAV}:calendar-data`,
      `${DAVNamespaceShort.CALDAV}:expand`,
    ]);
    expect(props[`${DAVNamespaceShort.DAV}:getetag`]).not.toHaveProperty(
      `${DAVNamespaceShort.CALDAV}:expand`,
    );
  });

  it('should still perform two queries if expand is false (minimal first query)', async () => {
    // First call: calendarQuery for hrefs
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/cal/event.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
        },
      },
    ]);

    // Second call: calendarMultiGet for data
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/cal/event.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          calendarData: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
        },
      },
    ]);

    await fetchCalendarObjects({
      calendar: { url: 'http://example.com/cal/' },
      expand: false,
    });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(2);

    const firstCallBody = mockedCollectionQuery.mock.calls[0][0].body as any;
    const firstCallProps = firstCallBody['calendar-query'][`${DAVNamespaceShort.DAV}:prop`];
    expect(firstCallProps).toHaveProperty(`${DAVNamespaceShort.DAV}:getetag`);
    expect(firstCallProps).not.toHaveProperty(`${DAVNamespaceShort.CALDAV}:calendar-data`);
  });

  it('should throw for invalid timeRange format', async () => {
    await expect(
      fetchCalendarObjects({
        calendar: { url: 'http://example.com/cal/' },
        timeRange: { start: 'not-a-date', end: 'also-not-a-date' },
      }),
    ).rejects.toThrow('invalid timeRange format, not in ISO8601');
  });

  it('should throw when calendar is undefined', async () => {
    await expect(
      fetchCalendarObjects({
        calendar: undefined as any,
      }),
    ).rejects.toThrow('cannot fetchCalendarObjects for undefined calendar');
  });

  it('should throw when calendar is missing url', async () => {
    await expect(
      fetchCalendarObjects({
        calendar: {} as any,
      }),
    ).rejects.toThrow('calendar must have url before fetchCalendarObjects');
  });

  it('should use useMultiGet=false path (calendarQuery for data)', async () => {
    mockedCollectionQuery
      .mockResolvedValueOnce([
        {
          href: '/cal/event.ics',
          ok: true,
          status: 200,
          statusText: 'OK',
          raw: '<xml/>',
          props: { getetag: '"1"' },
        },
      ])
      .mockResolvedValueOnce([
        {
          href: '/cal/event.ics',
          ok: true,
          status: 200,
          statusText: 'OK',
          raw: '<xml/>',
          props: { getetag: '"1"', calendarData: 'BEGIN:VCALENDAR\nEND:VCALENDAR' },
        },
      ]);

    const result = await fetchCalendarObjects({
      calendar: { url: 'http://example.com/cal/' },
      useMultiGet: false,
    });

    expect(result).toHaveLength(1);
    expect(result[0].data).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
    // Two calendarQuery calls (one for hrefs, one for data)
    expect(mockedCollectionQuery).toHaveBeenCalledTimes(2);
  });

  it('should return empty array when no calendar objects match urlFilter', async () => {
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/cal/not-ics-file.json',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"' },
      },
    ]);

    const result = await fetchCalendarObjects({
      calendar: { url: 'http://example.com/cal/' },
    });

    expect(result).toHaveLength(0);
  });

  it('should use provided objectUrls directly', async () => {
    mockedCollectionQuery.mockResolvedValueOnce([
      {
        href: '/cal/event1.ics',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: { getetag: '"1"', calendarData: 'data1' },
      },
    ]);

    const result = await fetchCalendarObjects({
      calendar: { url: 'http://example.com/cal/' },
      objectUrls: ['http://example.com/cal/event1.ics'],
    });

    expect(result).toHaveLength(1);
    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
  });
});

describe('calendarQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call collectionQuery with calendar-query body', async () => {
    mockedCollectionQuery.mockResolvedValue([
      { href: '/cal/event.ics', ok: true, status: 200, statusText: 'OK', props: {} },
    ]);

    const result = await calendarQuery({
      url: 'http://example.com/cal/',
      props: { 'd:getetag': {} },
      filters: { 'comp-filter': { _attributes: { name: 'VCALENDAR' } } },
    });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    const callBody = mockedCollectionQuery.mock.calls[0][0].body;
    expect(callBody).toHaveProperty('calendar-query');
  });
});

describe('calendarMultiGet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call collectionQuery with calendar-multiget body', async () => {
    mockedCollectionQuery.mockResolvedValue([
      { href: '/cal/event.ics', ok: true, status: 200, statusText: 'OK', props: {} },
    ]);

    const result = await calendarMultiGet({
      url: 'http://example.com/cal/',
      props: { 'd:getetag': {} },
      objectUrls: ['/cal/event.ics'],
      depth: '1',
    });

    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    const callBody = mockedCollectionQuery.mock.calls[0][0].body;
    expect(callBody).toHaveProperty('calendar-multiget');
  });
});

describe('makeCalendar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call davRequest with MKCALENDAR method', async () => {
    mockedDavRequest.mockResolvedValue([
      { href: '/cal/new/', ok: true, status: 201, statusText: 'Created' },
    ]);

    const result = await makeCalendar({
      url: 'http://example.com/cal/new/',
      props: { 'd:displayname': 'New Cal' },
    });

    expect(mockedDavRequest).toHaveBeenCalledTimes(1);
    expect(mockedDavRequest.mock.calls[0][0].init.method).toBe('MKCALENDAR');
    expect(result).toHaveLength(1);
  });
});

describe('fetchCalendars', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should throw when no account is provided', async () => {
    await expect(fetchCalendars()).rejects.toThrow('no account for fetchCalendars');
  });

  it('should throw when account is missing homeUrl', async () => {
    await expect(
      fetchCalendars({
        account: { serverUrl: 'https://example.com/', accountType: 'caldav' },
      }),
    ).rejects.toThrow('account must have homeUrl,rootUrl before fetchCalendars');
  });

  it('should fetch and parse calendars', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/cal/personal/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Personal',
          resourcetype: { calendar: {}, collection: {} },
          supportedCalendarComponentSet: {
            comp: { _attributes: { name: 'VEVENT' } },
          },
          getctag: 'ctag1',
          syncToken: 'sync1',
          calendarColor: '#ff0000',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue(['syncCollection']);

    const result = await fetchCalendars({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/cal/',
        rootUrl: 'https://example.com/',
        accountType: 'caldav',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Personal');
    expect(result[0].ctag).toBe('ctag1');
    expect(result[0].components).toEqual(['VEVENT']);
    expect(result[0].reports).toEqual(['syncCollection']);
  });

  it('should filter out non-iCal calendars', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/cal/good/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Good',
          resourcetype: { calendar: {} },
          supportedCalendarComponentSet: { comp: { _attributes: { name: 'VEVENT' } } },
          getctag: 'c1',
        },
      },
      {
        href: '/cal/bad/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Bad',
          resourcetype: { calendar: {} },
          supportedCalendarComponentSet: { comp: { _attributes: { name: 'UNKNOWN_TYPE' } } },
          getctag: 'c2',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await fetchCalendars({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/cal/',
        rootUrl: 'https://example.com/',
        accountType: 'caldav',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Good');
  });

  it('should accept calendars when supported-calendar-component-set is missing', async () => {
    // Some servers (e.g. Purelymail) violate RFC 4791 § 5.2.3 by not returning the
    // supported-calendar-component-set property. The previous resourcetype filter has
    // already confirmed these are calendar collections, so they should pass through.
    mockedPropfind.mockResolvedValue([
      {
        href: '/cal/empty-prop/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Empty Prop',
          resourcetype: { calendar: {}, collection: {} },
          // Server returned <supported-calendar-component-set/> with no children
          supportedCalendarComponentSet: {},
          getctag: 'c1',
        },
      },
      {
        href: '/cal/missing-prop/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'Missing Prop',
          resourcetype: { calendar: {}, collection: {} },
          // Property entirely absent from the response
          getctag: 'c2',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await fetchCalendars({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/cal/',
        rootUrl: 'https://example.com/',
        accountType: 'caldav',
      },
    });

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.displayName)).toEqual(['Empty Prop', 'Missing Prop']);
  });
});

describe('fetchCalendarUserAddresses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return calendar user addresses', async () => {
    mockedPropfind.mockResolvedValue([
      {
        href: '/principals/user/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          calendarUserAddressSet: { href: ['mailto:user@example.com', 'mailto:alias@example.com'] },
        },
      },
    ]);

    const result = await fetchCalendarUserAddresses({
      account: {
        serverUrl: 'https://example.com/',
        principalUrl: 'https://example.com/principals/user/',
        rootUrl: 'https://example.com/',
        accountType: 'caldav',
      },
    });

    expect(result).toEqual(['mailto:user@example.com', 'mailto:alias@example.com']);
  });

  it('should throw when account is missing principalUrl', async () => {
    await expect(
      fetchCalendarUserAddresses({
        account: { serverUrl: 'https://example.com/', accountType: 'caldav' },
      }),
    ).rejects.toThrow('account must have principalUrl,rootUrl before fetchUserAddresses');
  });
});

describe('createCalendarObject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call createObject with correct params', async () => {
    mockedCreateObject.mockResolvedValue({ ok: true, status: 201 } as any);

    await createCalendarObject({
      calendar: { url: 'http://example.com/cal/' },
      iCalString: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
      filename: 'event.ics',
    });

    expect(mockedCreateObject).toHaveBeenCalledTimes(1);
    const callArgs = mockedCreateObject.mock.calls[0][0];
    expect(callArgs.url).toBe('http://example.com/cal/event.ics');
    expect(callArgs.data).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
    expect(callArgs.headers?.['content-type']).toBe('text/calendar; charset=utf-8');
    expect(callArgs.headers?.['If-None-Match']).toBe('*');
  });
});

describe('updateCalendarObject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call updateObject with etag', async () => {
    mockedUpdateObject.mockResolvedValue({ ok: true, status: 200 } as any);

    await updateCalendarObject({
      calendarObject: {
        url: 'http://example.com/cal/event.ics',
        etag: '"etag1"',
        data: 'updated-ical-data',
      },
    });

    expect(mockedUpdateObject).toHaveBeenCalledTimes(1);
    const callArgs = mockedUpdateObject.mock.calls[0][0];
    expect(callArgs.url).toBe('http://example.com/cal/event.ics');
    expect(callArgs.etag).toBe('"etag1"');
    expect(callArgs.data).toBe('updated-ical-data');
  });
});

describe('deleteCalendarObject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call deleteObject with etag', async () => {
    mockedDeleteObject.mockResolvedValue({ ok: true, status: 204 } as any);

    await deleteCalendarObject({
      calendarObject: {
        url: 'http://example.com/cal/event.ics',
        etag: '"etag1"',
      },
    });

    expect(mockedDeleteObject).toHaveBeenCalledTimes(1);
    const callArgs = mockedDeleteObject.mock.calls[0][0];
    expect(callArgs.url).toBe('http://example.com/cal/event.ics');
    expect(callArgs.etag).toBe('"etag1"');
  });
});

describe('syncCalendars', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should throw when no account is provided', async () => {
    await expect(
      syncCalendars({
        oldCalendars: [],
      }),
    ).rejects.toThrow('Must have account before syncCalendars');
  });

  it('should detect created calendars', async () => {
    const account = {
      serverUrl: 'https://example.com/',
      homeUrl: 'https://example.com/cal/',
      rootUrl: 'https://example.com/',
      accountType: 'caldav' as const,
    };

    mockedPropfind.mockResolvedValue([
      {
        href: '/cal/new-calendar/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: {
          displayname: 'New Calendar',
          resourcetype: { calendar: {} },
          supportedCalendarComponentSet: { comp: { _attributes: { name: 'VEVENT' } } },
          getctag: 'ctag1',
          syncToken: 'sync1',
        },
      },
    ]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await syncCalendars({
      oldCalendars: [],
      account,
      detailedResult: true,
    });

    expect(result.created).toHaveLength(1);
    expect(result.created[0].displayName).toBe('New Calendar');
    expect(result.deleted).toHaveLength(0);
  });

  it('should return detailed result from syncCalendarsDetailed', async () => {
    const account = {
      serverUrl: 'https://example.com/',
      homeUrl: 'https://example.com/cal/',
      rootUrl: 'https://example.com/',
      accountType: 'caldav' as const,
    };

    mockedPropfind.mockResolvedValue([]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await syncCalendarsDetailed({
      oldCalendars: [],
      account,
    });

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.deleted).toHaveLength(0);
  });

  it('should detect deleted calendars', async () => {
    const account = {
      serverUrl: 'https://example.com/',
      homeUrl: 'https://example.com/cal/',
      rootUrl: 'https://example.com/',
      accountType: 'caldav' as const,
    };

    mockedPropfind.mockResolvedValue([]);
    mockedSupportedReportSet.mockResolvedValue([]);

    const result = await syncCalendars({
      oldCalendars: [
        {
          url: 'https://example.com/cal/old/',
          displayName: 'Old Calendar',
          components: ['VEVENT'],
          resourcetype: ['calendar'],
        },
      ],
      account,
      detailedResult: true,
    });

    expect(result.deleted).toHaveLength(1);
    expect(result.created).toHaveLength(0);
  });
});

describe('freeBusyQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call collectionQuery and return single result', async () => {
    mockedCollectionQuery.mockResolvedValue([
      {
        href: '/cal/',
        ok: true,
        status: 200,
        statusText: 'OK',
        props: { calendarData: 'BEGIN:VCALENDAR\nBEGIN:VFREEBUSY\nEND:VFREEBUSY\nEND:VCALENDAR' },
      },
    ]);

    const result = await freeBusyQuery({
      url: 'http://example.com/cal/',
      timeRange: { start: '2022-01-01T00:00:00Z', end: '2022-01-02T00:00:00Z' },
    });

    expect(result.ok).toBe(true);
    expect(mockedCollectionQuery).toHaveBeenCalledTimes(1);
  });

  it('should throw for invalid timeRange format', async () => {
    await expect(
      freeBusyQuery({
        url: 'http://example.com/cal/',
        timeRange: { start: 'bad', end: 'bad' },
      }),
    ).rejects.toThrow('invalid timeRange format, not in ISO8601');
  });
});

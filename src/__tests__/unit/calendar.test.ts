import { fetchCalendarObjects } from '../../calendar';
import * as request from '../../request';
import { DAVNamespaceShort } from '../../consts';

jest.mock('../../request');

const mockedDavRequest = request.davRequest as jest.MockedFunction<typeof request.davRequest>;

describe('fetchCalendarObjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly place expand under calendar-data in the initial query', async () => {
    mockedDavRequest.mockResolvedValue([
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
    expect(mockedDavRequest).toHaveBeenCalledTimes(1);

    const call = mockedDavRequest.mock.calls[0];
    const body = call[0].init.body as any;
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
    // First call returns hrefs
    mockedDavRequest.mockResolvedValueOnce([
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

    // Second call (multiget) returns data
    mockedDavRequest.mockResolvedValueOnce([
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

    expect(mockedDavRequest).toHaveBeenCalledTimes(2);

    const firstCallBody = mockedDavRequest.mock.calls[0][0].init.body as any;
    const firstCallProps = firstCallBody['calendar-query'][`${DAVNamespaceShort.DAV}:prop`];
    expect(firstCallProps).toHaveProperty(`${DAVNamespaceShort.DAV}:getetag`);
    expect(firstCallProps).not.toHaveProperty(`${DAVNamespaceShort.CALDAV}:calendar-data`);
  });
});

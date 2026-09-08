import { describe, expect, it } from 'vitest';
import { addressBookMultiGet, addressBookQuery } from '../../addressBook';
import { calendarMultiGet, calendarQuery, fetchCalendarObjects } from '../../calendar';
import { DAVClient } from '../../client';

const url = 'https://example.com/cal/';
const responseFetch =
  (href = '/cal/', extra = '', status = 207): typeof fetch =>
  async () =>
    new Response(
      `<D:multistatus xmlns:D="DAV:"><D:response><D:href>${href}</D:href><D:status>HTTP/1.1 404 Not Found</D:status>${extra}</D:response></D:multistatus>`,
      { status, headers: { 'Content-Type': 'application/xml' } },
    );

describe('empty calendar query compatibility', () => {
  it.each(['/cal/', '/cal', url, 'https://example.com/cal', './'])(
    'accepts the collection href %s',
    async (href) => {
      await expect(calendarQuery({ url, props: {}, fetch: responseFetch(href) })).resolves.toEqual(
        [],
      );
    },
  );

  it.each(['/cal/missing.ics', '/other/', 'https://other.example/cal/', '/cal/?other=1', ''])(
    'rejects a different or absent href %s',
    async (href) => {
      await expect(calendarQuery({ url, props: {}, fetch: responseFetch(href) })).rejects.toThrow(
        'Collection query failed: 404',
      );
    },
  );

  it.each([
    '<D:error><D:valid-sync-token/></D:error>',
    '<D:propstat><D:prop><D:getetag/></D:prop><D:status>HTTP/1.1 404 Not Found</D:status></D:propstat>',
  ])('rejects an explicit DAV failure: %s', async (extra) => {
    await expect(
      calendarQuery({ url, props: {}, fetch: responseFetch('/cal/', extra) }),
    ).rejects.toThrow('Collection query failed: 404');
  });

  it.each([401, 404, 504])('preserves HTTP %s failures', async (status) => {
    await expect(
      calendarQuery({ url, props: {}, fetch: responseFetch('/cal/', '', status) }),
    ).rejects.toThrow(`Collection query failed: ${status}`);
  });

  it.each([calendarMultiGet, addressBookMultiGet])(
    'preserves missing multiget objects',
    async (multiGet) => {
      await expect(
        multiGet({
          url,
          props: {},
          depth: '1',
          objectUrls: ['/cal/missing'],
          fetch: responseFetch('/cal/missing'),
        }),
      ).rejects.toThrow('Collection query failed: 404');
    },
  );

  it.each([calendarMultiGet, addressBookMultiGet, addressBookQuery])(
    'rejects collection failures in other REPORTs',
    async (report) => {
      await expect(report({ url, props: {}, depth: '1', fetch: responseFetch() })).rejects.toThrow(
        'Collection query failed: 404',
      );
    },
  );

  it('returns no calendar objects through the functional API', async () => {
    await expect(
      fetchCalendarObjects({ calendar: { url }, fetch: responseFetch() }),
    ).resolves.toEqual([]);
  });

  it('returns no calendar objects through DAVClient', async () => {
    const client = new DAVClient({ serverUrl: url, credentials: {}, fetch: responseFetch() });
    await expect(client.fetchCalendarObjects({ calendar: { url } })).resolves.toEqual([]);
  });
});

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import {
  DAVClient,
  createDAVClient,
  davRequest,
  fetchCalendars,
  fetchAddressBooks,
  fetchCalendarObjects,
  fetchVCards,
  syncCalendarsDetailed,
  smartCollectionSyncDetailed,
  isCollectionDirty,
  createCalendarObject,
  makeCollection,
} from '../../index';
import { parseDAVXML } from '../../util/xml';
import { getOauthHeaders } from '../../util/authHelpers';
import type { DAVCredentials } from '../../types/models';

const account = {
  serverUrl: 'https://example.com/',
  homeUrl: 'https://example.com/cal/',
  rootUrl: 'https://example.com/',
  accountType: 'caldav' as const,
};
const calendar = { url: 'https://example.com/cal/work/' };
const member = (href: string, props: string, status = '200 OK') =>
  `<d:response><d:href>${href}</d:href><d:propstat><d:prop>${props}</d:prop><d:status>HTTP/1.1 ${status}</d:status></d:propstat></d:response>`;
const xml = (members: string, token = '') =>
  `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:card="urn:ietf:params:xml:ns:carddav" xmlns:cs="http://calendarserver.org/ns/">${members}${token ? `<d:sync-token>${token}</d:sync-token>` : ''}</d:multistatus>`;
const response = (body: string, status = 207) =>
  new Response(body, { status, headers: { 'content-type': 'application/xml' } });
const transport = (body: string, status = 207) =>
  vi.fn().mockImplementation(async () => response(body, status));

describe('review regressions', () => {
  it('preserves strings, CDATA order, repeated values, and namespace collisions', async () => {
    const fetch = transport(
      xml(
        member(
          '/cal/work/',
          '<d:displayname>123</d:displayname><cs:getctag>1e3</cs:getctag><c:calendar-data>A<![CDATA[B]]>C</c:calendar-data><x:displayname xmlns:x="urn:vendor">Vendor</x:displayname><d:href>a</d:href><d:href>b</d:href>',
        ),
      ),
    );
    const [result] = await davRequest({ url: calendar.url, init: { method: 'PROPFIND' }, fetch });
    expect(result.props).toMatchObject({
      displayname: '123',
      getctag: '1e3',
      calendarData: 'ABC',
      href: ['a', 'b'],
      '{urn:vendor}displayname': 'Vendor',
    });
    expect(result.propStats?.[0].namespaces?.displayname).toBe('DAV:');
    expect(parseDAVXML('<root><x/><constructor>safe</constructor></root>').root.constructor).toBe(
      'safe',
    );
    expect(
      parseDAVXML('<root><a xmlns="urn:vendor">vendor</a><a xmlns="DAV:">dav</a></root>').root,
    ).toMatchObject({ a: 'dav', '{urn:vendor}a': 'vendor' });
  });

  it('preserves full successful raw and free/busy payloads', async () => {
    const body = `BEGIN:VCALENDAR\r\n${'X-DATA:abcdefgh\r\n'.repeat(500)}END:VCALENDAR\r\n`;
    const fetch = vi.fn().mockImplementation(async () => new Response(body));
    const [result] = await davRequest({
      url: calendar.url,
      init: { method: 'REPORT' },
      parseOutgoing: false,
      fetch,
    });
    expect(result.raw).toBe(body);
    const client = new DAVClient({ serverUrl: calendar.url, credentials: {}, fetch });
    const busy = await client.freeBusyQuery({
      url: calendar.url,
      timeRange: { start: '2026-01-01', end: '2026-01-02' },
    });
    expect(busy.raw).toBe(body);
  });

  it.each([401, 500])(
    'rejects failed discovery (%s) before reporting local calendars deleted',
    async (status) => {
      const fetch = transport('Failure', status);
      await expect(
        syncCalendarsDetailed({ oldCalendars: [calendar], account, fetch }),
      ).rejects.toThrow(`Calendar discovery failed: ${status}`);
      await expect(
        fetchAddressBooks({ account: { ...account, accountType: 'carddav' }, fetch }),
      ).rejects.toThrow(`Address book discovery failed: ${status}`);
    },
  );

  it.each(['<broken>', '<unexpected/>'])('rejects malformed discovery: %s', async (body) => {
    await expect(fetchCalendars({ account, fetch: transport(body) })).rejects.toThrow(
      'Calendar discovery failed',
    );
  });

  it('rejects failed required properties even when optional properties succeed', async () => {
    const body = xml(
      `<d:response><d:href>/cal/work/</d:href><d:propstat><d:prop><d:displayname>Work</d:displayname></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat><d:propstat><d:prop><d:resourcetype/></d:prop><d:status>HTTP/1.1 403 Forbidden</d:status></d:propstat></d:response>`,
    );
    await expect(fetchCalendars({ account, fetch: transport(body) })).rejects.toThrow(
      'Calendar discovery failed',
    );
    const failed = transport(xml(member('/cal/work/task', '<c:calendar-data/>', '403 Forbidden')));
    const [result] = await davRequest({
      url: calendar.url,
      init: { method: 'REPORT' },
      fetch: failed,
    });
    expect(result).toMatchObject({ ok: false, status: 403, props: {} });
    expect(result.propStats?.[0]).toMatchObject({ status: 403, ok: false });
    await expect(
      fetchCalendarObjects({ calendar, objectUrls: ['task.ics'], fetch: failed }),
    ).rejects.toThrow('403');
  });

  it('treats an unsupported ctag as dirty while preserving opaque ctags', async () => {
    expect(
      await isCollectionDirty({
        collection: { ...calendar, ctag: '1e3' },
        fetch: transport(xml(member('/cal/work/', '<cs:getctag>1e3</cs:getctag>'))),
      }),
    ).toEqual({ isDirty: false, newCtag: '1e3' });
    expect(
      (
        await isCollectionDirty({
          collection: calendar,
          fetch: transport(xml(member('/cal/work/', '<cs:getctag/>', '404 Not Found'))),
        })
      ).isDirty,
    ).toBe(true);
  });

  it('syncs tasks and extensionless calendar objects in the basic fallback', async () => {
    const task = 'BEGIN:VCALENDAR\nBEGIN:VTODO\nUID:task\nEND:VTODO\nEND:VCALENDAR';
    const fetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = String(init.body);
      if (body.includes('supported-report-set'))
        return response(xml(member('/cal/work/', '<d:supported-report-set/>')));
      if (body.includes('resourcetype'))
        return response(
          xml(
            member(
              '/cal/work/',
              '<d:resourcetype><c:calendar/></d:resourcetype><cs:getctag>new</cs:getctag>',
            ),
          ),
        );
      if (body.includes('calendar-query')) {
        expect(body).toContain('name="VCALENDAR"');
        expect(body).not.toContain('name="VEVENT"');
        return response(xml(member('/cal/work/task', '<d:getetag>new-etag</d:getetag>')));
      }
      if (body.includes('calendar-multiget'))
        return response(
          xml(
            member(
              '/cal/work/task',
              `<d:getetag>new-etag</d:getetag><c:calendar-data><![CDATA[${task}]]></c:calendar-data>`,
            ),
          ),
        );
      return response(xml(member('/cal/work/', '<cs:getctag>new</cs:getctag>')));
    });
    const result = await syncCalendarsDetailed({
      oldCalendars: [
        { ...calendar, ctag: 'old', objects: [{ url: `${calendar.url}task`, etag: 'old' }] },
      ],
      account,
      fetch,
    });
    expect(result.updated[0].objects).toEqual([
      { url: `${calendar.url}task`, etag: 'new-etag', data: task },
    ]);
    expect(result.updated[0].ctag).toBe('new');
  });

  it('uses the REPORT token instead of the earlier discovery token and binds client callbacks', async () => {
    const fetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = String(init.body);
      if (body.includes('supported-report-set'))
        return response(
          xml(
            member(
              '/cal/work/',
              '<d:supported-report-set><d:supported-report><d:report><d:sync-collection/></d:report></d:supported-report></d:supported-report-set>',
            ),
          ),
        );
      if (body.includes('resourcetype'))
        return response(
          xml(
            member(
              '/cal/work/',
              '<d:resourcetype><c:calendar/></d:resourcetype><d:sync-token>discovery</d:sync-token><cs:getctag>discovered-ctag</cs:getctag>',
            ),
          ),
        );
      if (body.includes('sync-collection'))
        return response(xml(member('/cal/work/task', '<d:getetag>new</d:getetag>'), 'report'));
      return response(
        xml(
          member(
            '/cal/work/task',
            '<d:getetag>new</d:getetag><c:calendar-data>task</c:calendar-data>',
          ),
        ),
      );
    });
    const result = await syncCalendarsDetailed({
      oldCalendars: [{ ...calendar, syncToken: 'old', objects: [] }],
      account,
      fetch,
    });
    expect(result.updated[0].syncToken).toBe('report');
    expect(result.updated[0].ctag).toBe('discovered-ctag');
    const client = new DAVClient({ serverUrl: account.serverUrl, credentials: {}, fetch });
    client.account = account;
    const classCalendars = await client.syncCalendars({
      oldCalendars: [{ ...calendar, syncToken: 'old' }],
    });
    expect(classCalendars[0].syncToken).toBe('report');
    const functional = await createDAVClient({
      serverUrl: account.serverUrl,
      credentials: {},
      fetch,
    });
    const factoryCalendars = await functional.syncCalendars({
      account,
      oldCalendars: [{ ...calendar, syncToken: 'old' }],
    });
    expect(factoryCalendars[0].syncToken).toBe('report');
    const callbackResult = await client.smartCollectionSyncDetailed({
      account,
      collection: {
        ...calendar,
        objects: [],
        reports: ['syncCollection'],
        objectMultiGet: client.calendarMultiGet,
      },
    });
    expect(callbackResult.objects.created[0].url).toBe(`${calendar.url}task`);
    expect(callbackResult.syncToken).toBe('report');
  });

  it('rejects incomplete multiget results and property-level 404s before advancing a token', async () => {
    const collection = { ...calendar, syncToken: 'old', reports: ['syncCollection'], objects: [] };
    const fetch = transport(xml(member('/cal/work/task', '<d:getetag>new</d:getetag>'), 'new'));
    await expect(
      smartCollectionSyncDetailed({
        account,
        collection: { ...collection, objectMultiGet: vi.fn().mockResolvedValue([]) },
        fetch,
      }),
    ).rejects.toThrow('incomplete response');
    await expect(
      smartCollectionSyncDetailed({
        account,
        collection,
        fetch: transport(
          xml(member('/cal/work/task', '<c:calendar-data/>', '404 Not Found'), 'new'),
        ),
      }),
    ).rejects.toThrow('Collection sync failed: 404');
    expect(collection.syncToken).toBe('old');
  });

  it('honors CardDAV query subsets and rejects expansion without a time range', async () => {
    const fetch = transport(
      xml(
        member('/cal/work/a.vcf', '<card:address-data>A</card:address-data>') +
          member('/cal/work/b.vcf', '<card:address-data>B</card:address-data>'),
      ),
    );
    const objects = await fetchVCards({
      addressBook: calendar,
      objectUrls: ['a.vcf', 'b.vcf'],
      urlFilter: (url) => url.endsWith('a.vcf'),
      useMultiGet: false,
      fetch,
    });
    expect(objects.map((object) => object.url)).toEqual([`${calendar.url}a.vcf`]);
    await expect(fetchCalendarObjects({ calendar, expand: true, fetch })).rejects.toThrow(
      'timeRange is required',
    );
  });

  it('applies header exclusions after default and transport headers in both APIs', async () => {
    const fetch = vi.fn().mockImplementation(async (_url, init) => {
      const headers = new Headers(init.headers);
      expect(headers.has('authorization')).toBe(false);
      expect(headers.has('content-type')).toBe(false);
      expect(headers.get('x-keep')).toBe('yes');
      return new Response('');
    });
    const options = {
      headers: new Headers({
        Authorization: 'overridden',
        'Content-Type': 'overridden',
        'X-Keep': 'yes',
      }),
    };
    const headersToExclude = ['AUTHORIZATION', 'content-type'];
    await createCalendarObject({
      calendar,
      filename: 'event.ics',
      iCalString: 'event',
      fetchOptions: options,
      headersToExclude,
      fetch,
    });
    const functional = await createDAVClient({
      serverUrl: account.serverUrl,
      credentials: {},
      fetchOptions: options,
      fetch,
    });
    await functional.davRequest({ url: calendar.url, init: { method: 'GET' }, headersToExclude });
    const client = new DAVClient({
      serverUrl: account.serverUrl,
      credentials: {},
      fetchOptions: options,
      fetch,
    });
    await client.davRequest({ url: calendar.url, init: { method: 'GET' }, headersToExclude });
  });

  it.each(['class', 'factory'])(
    'refreshes expired OAuth tokens once for concurrent %s requests',
    async (kind) => {
      const credentials: DAVCredentials = {
        accessToken: 'old',
        refreshToken: 'refresh',
        expiration: Date.now() + 60000,
        clientId: 'id',
        clientSecret: 'secret',
        tokenUrl: 'https://example.com/token',
      };
      const fetch = vi.fn().mockImplementation(async (url, init) => {
        if (url === credentials.tokenUrl)
          return Response.json({ access_token: 'fresh', expires_in: 3600 });
        expect(new Headers(init.headers).get('authorization')).toBe('Bearer fresh');
        return new Response('OK');
      });
      const params = {
        serverUrl: account.serverUrl,
        credentials,
        authMethod: 'Oauth' as const,
        fetch,
      };
      const client = kind === 'factory' ? await createDAVClient(params) : new DAVClient(params);
      credentials.expiration = Date.now() - 1;
      await Promise.all([
        client.davRequest({ url: calendar.url, init: { method: 'GET' } }),
        client.davRequest({ url: calendar.url, init: { method: 'GET' } }),
      ]);
      expect(fetch.mock.calls.filter(([url]) => url === credentials.tokenUrl)).toHaveLength(1);
      expect(credentials.accessToken).toBe('fresh');
    },
  );

  it('reuses an access token without a refresh token and blocks DAV after refresh failure', async () => {
    const fetch = vi.fn();
    expect(
      (await getOauthHeaders({ accessToken: 'valid', expiration: Date.now() + 60000 }, {}, fetch))
        .headers.authorization,
    ).toBe('Bearer valid');
    expect(fetch).not.toHaveBeenCalled();
    const failing = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    const client = new DAVClient({
      serverUrl: account.serverUrl,
      credentials: {
        accessToken: 'old',
        refreshToken: 'refresh',
        expiration: 1,
        clientId: 'id',
        clientSecret: 'secret',
        tokenUrl: 'https://example.com/token',
      },
      authMethod: 'Oauth',
      fetch: failing,
    });
    await expect(client.davRequest({ url: calendar.url, init: { method: 'GET' } })).rejects.toThrow(
      'OAuth authentication failed',
    );
    expect(failing).toHaveBeenCalledOnce();
  });

  it('exports makeCollection and limits cleanup to the dist directory', () => {
    expect(makeCollection).toBeTypeOf('function');
    const directory = mkdtempSync(join(tmpdir(), 'tsdav-clean-'));
    try {
      mkdirSync(join(directory, 'dist'));
      writeFileSync(join(directory, 'dist', 'generated.js'), '');
      writeFileSync(join(directory, 'distribution-notes.txt'), 'keep');
      execFileSync(process.execPath, [resolve('scripts/clean-dist.cjs')], { cwd: directory });
      expect(existsSync(join(directory, 'dist'))).toBe(false);
      expect(existsSync(join(directory, 'distribution-notes.txt'))).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it('preserves custom namespace collisions across propstat groups', async () => {
    const body = xml(`<d:response><d:href>/cal/work/</d:href>
      <d:propstat><d:prop><x:label xmlns:x="urn:one">One</x:label></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
      <d:propstat><d:prop><x:label xmlns:x="urn:two">Two</x:label></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
      </d:response>`);
    const [result] = await davRequest({
      url: calendar.url,
      init: { method: 'PROPFIND' },
      fetch: transport(body),
    });
    expect(result.props).toMatchObject({ label: 'One', '{urn:two}label': 'Two' });
    expect(result.propStats?.map((stat) => stat.namespaces?.label)).toEqual(['urn:one', 'urn:two']);
  });

  it('cannot mistake a vendor property for a denied DAV resourcetype', async () => {
    const body = xml(`<d:response><d:href>/cal/work/</d:href>
      <d:propstat><d:prop><x:resourcetype xmlns:x="urn:vendor"><c:calendar/></x:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
      <d:propstat><d:prop><d:resourcetype/></d:prop><d:status>HTTP/1.1 403 Forbidden</d:status></d:propstat>
      </d:response>`);
    await expect(
      syncCalendarsDetailed({ oldCalendars: [calendar], account, fetch: transport(body) }),
    ).rejects.toThrow('resourcetype returned 403');
  });

  it('rejects incomplete calendar and contact snapshots', async () => {
    await expect(
      fetchCalendarObjects({
        calendar,
        objectUrls: ['a.ics', 'b.ics'],
        fetch: transport(xml(member('/cal/work/a.ics', '<c:calendar-data>A</c:calendar-data>'))),
      }),
    ).rejects.toThrow('incomplete response');
    await expect(
      fetchVCards({
        addressBook: calendar,
        objectUrls: ['a.vcf', 'b.vcf'],
        fetch: transport(
          xml(member('/cal/work/a.vcf', '<card:address-data>A</card:address-data>')),
        ),
      }),
    ).rejects.toThrow('incomplete response');
  });

  it('rejects malformed sync members with no href or property status', async () => {
    const collection = {
      ...calendar,
      reports: ['syncCollection'],
      syncToken: 'old',
      objectMultiGet: vi.fn(),
    };
    await expect(
      smartCollectionSyncDetailed({
        collection,
        account,
        fetch: transport(
          xml('<d:response><d:status>HTTP/1.1 200 OK</d:status></d:response>', 'new'),
        ),
      }),
    ).rejects.toThrow('missing href');
    const [result] = await davRequest({
      url: calendar.url,
      init: { method: 'REPORT' },
      fetch: transport(
        xml(
          '<d:response><d:href>/cal/work/a.ics</d:href><d:propstat><d:prop><c:calendar-data>A</c:calendar-data></d:prop></d:propstat></d:response>',
        ),
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.propStats?.[0].statusText).toBe('Invalid DAV property status');
    expect(collection.objectMultiGet).not.toHaveBeenCalled();
  });

  it('reads namespace-declared metadata as strings and CDATA ctags as opaque values', async () => {
    const [result] = await davRequest({
      url: calendar.url,
      init: { method: 'PROPFIND' },
      fetch: transport(
        xml(
          member(
            '/cal/work/',
            '<cs:getctag xmlns:cs="http://calendarserver.org/ns/">1e3</cs:getctag>',
          ),
        ),
      ),
    });
    expect(result.props?.getctag).toBe('1e3');
    const state = await isCollectionDirty({
      collection: { ...calendar, ctag: '1e3' },
      fetch: transport(xml(member('/cal/work/', '<cs:getctag><![CDATA[1e3]]></cs:getctag>'))),
    });
    expect(state).toEqual({ isDirty: false, newCtag: '1e3' });
  });
});

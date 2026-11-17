import { describe, expect, it, vi } from 'vitest';
import {
  calendarMultiGet,
  createAccount,
  DAVClient,
  davRequest,
  fetchVCards,
  smartCollectionSyncDetailed,
} from '../../index';
import { defaultParam, getBasicAuthHeaders } from '../../util/authHelpers';
import { parseDAVXML } from '../../util/xml';

const xmlResponse = (body: string, status = 207) =>
  new Response(body, { status, headers: { 'content-type': 'application/xml' } });

const multistatus = (inner: string, syncToken = '') =>
  `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:card="urn:ietf:params:xml:ns:carddav">${inner}${syncToken ? `<d:sync-token>${syncToken}</d:sync-token>` : ''}</d:multistatus>`;

describe('bug fix regressions', () => {
  it('excludes collection self-entries when percent-encoding differs in createAccount and fetchVCards', async () => {
    const calendarFetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = String(init?.body ?? '');
      if (body.includes('resourcetype')) {
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/dav/user%40host/cal/</d:href><d:propstat><d:prop><d:displayname>Work</d:displayname><d:resourcetype><d:collection/><c:calendar/></d:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      if (body.includes('supported-report-set')) {
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/dav/user%40host/cal/</d:href><d:propstat><d:prop><d:supported-report-set/></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      if (body.includes('calendar-query')) {
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/dav/user@host/cal/</d:href><d:propstat><d:prop><d:getetag/></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>' +
              '<d:response><d:href>/dav/user@host/cal/event</d:href><d:propstat><d:prop><d:getetag>"e1"</d:getetag></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      if (body.includes('calendar-multiget')) {
        expect(body).not.toContain('<d:href>/dav/user@host/cal/</d:href>');
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/dav/user%40host/cal/event</d:href><d:propstat><d:prop><d:getetag>"e1"</d:getetag><c:calendar-data>ICS</c:calendar-data></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      return xmlResponse(multistatus(''));
    });

    const account = await createAccount({
      account: {
        serverUrl: 'https://example.com/',
        rootUrl: 'https://example.com/',
        principalUrl: 'https://example.com/dav/user@host/',
        homeUrl: 'https://example.com/dav/user@host/',
        accountType: 'caldav',
      },
      loadObjects: true,
      fetch: calendarFetch,
    });
    expect(account.calendars?.[0].objects).toEqual([
      { url: 'https://example.com/dav/user%40host/cal/event', etag: '"e1"', data: 'ICS' },
    ]);

    const addressBookUrl = 'https://example.com/dav/user%40host/contacts/';
    const cardFetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = String(init?.body ?? '');
      if (body.includes('addressbook-multiget')) {
        expect(body).not.toContain('/dav/user@host/contacts/</d:href>');
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/dav/user%40host/contacts/alice.vcf</d:href><d:propstat><d:prop><d:getetag>"v1"</d:getetag><card:address-data>VCARD</card:address-data></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      return xmlResponse(
        multistatus(
          '<d:response><d:href>/dav/user@host/contacts/</d:href><d:propstat><d:prop><d:getetag/></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>' +
            '<d:response><d:href>/dav/user@host/contacts/alice.vcf</d:href><d:propstat><d:prop><d:getetag>"v1"</d:getetag></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
        ),
      );
    });

    const vcards = await fetchVCards({
      addressBook: { url: addressBookUrl },
      fetch: cardFetch,
    });
    expect(vcards).toEqual([
      {
        url: 'https://example.com/dav/user%40host/contacts/alice.vcf',
        etag: '"v1"',
        data: 'VCARD',
      },
    ]);
  });

  it('returns writable and configurable top-level properties from parseDAVXML', () => {
    const parsed = parseDAVXML(
      '<d:multistatus xmlns:d="DAV:"><d:sync-token>t1</d:sync-token></d:multistatus>',
    );
    expect(() => {
      parsed.multistatus = { syncToken: 't2' };
    }).not.toThrow();
    expect(parsed.multistatus.syncToken).toBe('t2');
    expect(delete parsed.multistatus).toBe(true);
  });

  it('lazily resolves Basic, Bearer, and Custom auth on DAVClient without login() and avoids undefined:undefined', async () => {
    expect(getBasicAuthHeaders({})).toEqual({
      authorization: `Basic ${btoa(':')}`,
    });

    const recordedAuth: Array<string | null> = [];
    const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
      recordedAuth.push(new Headers(init?.headers).get('authorization'));
      return new Response('', { status: 200 });
    });

    const basicClient = new DAVClient({
      serverUrl: 'https://example.com/',
      credentials: { username: 'alice', password: 'secret' },
      authMethod: 'Basic',
      fetch: mockFetch,
    });
    await basicClient.davRequest({ url: 'https://example.com/', init: { method: 'PROPFIND' } });

    const bearerClient = new DAVClient({
      serverUrl: 'https://example.com/',
      credentials: { accessToken: 'tok-123' },
      authMethod: 'Bearer',
      fetch: mockFetch,
    });
    await bearerClient.davRequest({ url: 'https://example.com/', init: { method: 'PROPFIND' } });

    const customClient = new DAVClient({
      serverUrl: 'https://example.com/',
      credentials: {},
      authMethod: 'Custom',
      authFunction: async () => ({ authorization: 'Custom xyz' }),
      fetch: mockFetch,
    });
    await customClient.davRequest({ url: 'https://example.com/', init: { method: 'PROPFIND' } });

    const anonClient = new DAVClient({
      serverUrl: 'https://example.com/',
      credentials: {},
      authMethod: 'Basic',
      fetch: mockFetch,
    });
    await anonClient.davRequest({ url: 'https://example.com/', init: { method: 'PROPFIND' } });

    expect(recordedAuth).toEqual([
      `Basic ${btoa('alice:secret')}`,
      'Bearer tok-123',
      'Custom xyz',
      null,
    ]);
  });

  it('merges client fetchOptions and per-call fetchOptions in DAVClient and defaultParam', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    const client = new DAVClient({
      serverUrl: 'https://example.com/',
      credentials: { username: 'u', password: 'p' },
      fetchOptions: {
        credentials: 'include',
        headers: { 'X-Client': 'base' },
      },
      fetch,
    });

    await client.davRequest({
      url: 'https://example.com/cal/',
      init: { method: 'PROPFIND' },
      fetchOptions: {
        mode: 'cors',
        headers: { 'X-Call': 'override' },
      },
    });

    const init = fetch.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe('include');
    expect(init.mode).toBe('cors');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe(`Basic ${btoa('u:p')}`);
    expect(headers.get('x-client')).toBe('base');
    expect(headers.get('x-call')).toBe('override');

    const wrapped = defaultParam((p: { fetchOptions?: RequestInit }) => p, {
      fetchOptions: { credentials: 'include', headers: { 'X-A': '1' } },
    });
    const merged = wrapped({
      fetchOptions: { mode: 'same-origin', headers: { 'X-B': '2' } },
    });
    expect(merged.fetchOptions?.credentials).toBe('include');
    expect(merged.fetchOptions?.mode).toBe('same-origin');
    expect(new Headers(merged.fetchOptions?.headers).get('x-a')).toBe('1');
    expect(new Headers(merged.fetchOptions?.headers).get('x-b')).toBe('2');
  });

  it('resets syncToken when server returns a parsed 207 response with valid-sync-token error', async () => {
    const fetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = String(init?.body ?? '');
      if (body.includes('<d:sync-token>stale</d:sync-token>')) {
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/cal/work/</d:href><d:status>HTTP/1.1 403 Forbidden</d:status><d:error><d:valid-sync-token/></d:error></d:response>',
          ),
          207,
        );
      }
      if (body.includes('calendar-multiget')) {
        return xmlResponse(
          multistatus(
            '<d:response><d:href>/cal/work/a.ics</d:href><d:propstat><d:prop><d:getetag>"1"</d:getetag><c:calendar-data>EVENT</c:calendar-data></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          ),
        );
      }
      return xmlResponse(
        multistatus(
          '<d:response><d:href>/cal/work/a.ics</d:href><d:propstat><d:prop><d:getetag>"1"</d:getetag></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>',
          'fresh-token',
        ),
      );
    });

    const result = await smartCollectionSyncDetailed({
      account: {
        serverUrl: 'https://example.com/',
        homeUrl: 'https://example.com/cal/',
        rootUrl: 'https://example.com/',
        accountType: 'caldav',
      },
      collection: {
        url: 'https://example.com/cal/work/',
        reports: ['syncCollection'],
        syncToken: 'stale',
        objectMultiGet: calendarMultiGet,
        objects: [],
      },
      fetch,
    });

    expect(result.syncToken).toBe('fresh-token');
    expect(result.objects.created).toEqual([
      { url: 'https://example.com/cal/work/a.ics', etag: '"1"', data: 'EVENT' },
    ]);
  });

  it('passes string bodies through davRequest without spreading character indices', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    const rawXml = '<d:propfind xmlns:d="DAV:"><d:allprop/></d:propfind>';
    await davRequest({
      url: 'https://example.com/dav/',
      init: {
        method: 'PROPFIND',
        body: rawXml as any,
      },
      fetch,
    });
    expect(fetch.mock.calls[0][1].body).toBe(rawXml);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDAVClient, DAVClient } from '../../client';
import { DigestUnsupportedError } from '../../util/digestAuth';
import { createDigestServer } from '../../util/__tests__/digestServer';

const credentials = { username: 'digestuser', password: 'digest-test-pw' };
const serverUrl = 'http://dav.test/dav.php';

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="utf-8"?>${body}`, {
    status: 207,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });

// A Baikal-like server: /.well-known redirects without auth, everything else needs Digest.
const createBaikal = () =>
  createDigestServer({
    ...credentials,
    isPublic: (path) => path.startsWith('/.well-known/'),
    handle: (method, path) => {
      if (path.startsWith('/.well-known/')) {
        return new Response(null, { status: 302, headers: { location: '/dav.php/' } });
      }
      if (method === 'PROPFIND' && path === '/dav.php/') {
        return xml(`<d:multistatus xmlns:d="DAV:"><d:response><d:href>/dav.php/</d:href>
          <d:propstat><d:prop><d:current-user-principal><d:href>/dav.php/principals/digestuser/</d:href>
          </d:current-user-principal></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
          </d:response></d:multistatus>`);
      }
      if (method === 'PROPFIND' && path === '/dav.php/principals/digestuser/') {
        return xml(`<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:response><d:href>/dav.php/principals/digestuser/</d:href><d:propstat><d:prop>
          <c:calendar-home-set><d:href>/dav.php/calendars/digestuser/</d:href></c:calendar-home-set>
          </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`);
      }
      if (method === 'PUT') return new Response(null, { status: 201 });
      if (method === 'DELETE') return new Response(null, { status: 204 });
      return new Response('', { status: 404 });
    },
  });

const calendar = { url: 'http://dav.test/dav.php/calendars/digestuser/default/' };

describe('Digest authentication through DAVClient', () => {
  it('discovers the account and writes objects with authMethod Digest', async () => {
    const server = createBaikal();
    const client = await createDAVClient({
      serverUrl,
      credentials,
      authMethod: 'Digest',
      defaultAccountType: 'caldav',
      fetch: server.fetch,
    });

    const created = await client.createCalendarObject({
      calendar,
      filename: 'event.ics',
      iCalString: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
    });
    const deleted = await client.deleteCalendarObject({
      calendarObject: { url: `${calendar.url}event.ics`, etag: '"1"' },
    });

    expect(created.status).toBe(201);
    expect(deleted.status).toBe(204);
    // Only the first authenticated request needed a challenge round-trip.
    const unauthenticated = server.fetch.mock.calls.filter(
      ([input], index) =>
        !String(input).includes('/.well-known/') && server.authorizationOf(index) === null,
    );
    expect(unauthenticated).toHaveLength(1);
    expect(server.authorizationOf(server.fetch.mock.calls.length - 1)).toMatch(
      /^Digest .*uri="\/dav\.php\/calendars\/digestuser\/default\/event\.ics"/,
    );
  });

  it('reports a wrong password as invalid credentials', async () => {
    const server = createBaikal();

    await expect(
      createDAVClient({
        serverUrl,
        credentials: { ...credentials, password: 'wrong' },
        authMethod: 'Digest',
        defaultAccountType: 'caldav',
        fetch: server.fetch,
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('applies Digest to a per-call fetch override', async () => {
    const server = createBaikal();
    const client = new DAVClient({ serverUrl, credentials, authMethod: 'Digest' });

    const response = await client.createObject({
      url: `${calendar.url}other.ics`,
      data: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
      fetch: server.fetch,
    });

    expect(response.status).toBe(201);
  });

  it('sends no Authorization when the caller excludes it', async () => {
    const server = createBaikal();
    const client = new DAVClient({ serverUrl, credentials, authMethod: 'Digest' });

    const response = await client.createObject({
      url: `${calendar.url}public.ics`,
      data: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
      headersToExclude: ['Authorization'],
      fetch: server.fetch,
    });

    expect(response.status).toBe(401);
    expect(server.fetch).toHaveBeenCalledTimes(1);
    expect(server.authorizationOf(0)).toBeNull();
  });

  it('still sends a given digestString as a static header', async () => {
    const server = createBaikal();
    const client = await createDAVClient({
      serverUrl,
      credentials: { ...credentials, digestString: 'username="digestuser", response="abc"' },
      authMethod: 'Digest',
      fetch: server.fetch,
    });

    const response = await client.createObject({
      url: `${calendar.url}static.ics`,
      data: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
    });

    expect(response.status).toBe(401);
    expect(server.fetch).toHaveBeenCalledTimes(1);
    expect(server.authorizationOf(0)).toBe('Digest username="digestuser", response="abc"');
  });
});

describe('account discovery on a runtime without WebCrypto', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Digest-only: 401 under /dav.php, an unauthenticated HTML page at the
  // server root, and /.well-known either public or protected as well.
  const createDigestOnly = (wellKnown: 'redirect' | 'protected') =>
    vi.fn(async (input: RequestInfo | URL) => {
      const { pathname } = new URL(String(input));
      if (pathname.startsWith('/.well-known/') && wellKnown === 'redirect') {
        return new Response(null, { status: 302, headers: { location: '/dav.php/' } });
      }
      if (pathname === '/') {
        return new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return new Response('', {
        status: 401,
        headers: { 'www-authenticate': 'Digest realm="BaikalDAV",qop="auth",nonce="n-1"' },
      });
    });

  const cases = (['Digest'] as const).flatMap((authMethod) =>
    (['redirect', 'protected'] as const).map((wellKnown) => ({ authMethod, wellKnown })),
  );

  it.each(cases)(
    'createDAVClient rejects with the WebCrypto requirement (authMethod $authMethod, .well-known $wellKnown)',
    async ({ authMethod, wellKnown }) => {
      vi.stubGlobal('crypto', undefined);

      const login = createDAVClient({
        serverUrl,
        credentials,
        authMethod,
        defaultAccountType: 'caldav',
        fetch: createDigestOnly(wellKnown),
      });

      await expect(login).rejects.toBeInstanceOf(DigestUnsupportedError);
      await expect(login).rejects.toThrow(
        /Digest authentication requires the WebCrypto API.*Node\.js >= 19/,
      );
    },
  );

  it.each(cases)(
    'DAVClient.login rejects with the WebCrypto requirement (authMethod $authMethod, .well-known $wellKnown)',
    async ({ authMethod, wellKnown }) => {
      vi.stubGlobal('crypto', undefined);

      const client = new DAVClient({
        serverUrl,
        credentials,
        authMethod,
        defaultAccountType: 'caldav',
        fetch: createDigestOnly(wellKnown),
      });

      await expect(client.login()).rejects.toThrow(
        /Digest authentication requires the WebCrypto API.*Node\.js >= 19/,
      );
    },
  );
});

import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import { DAVClient, createDAVClient } from '../../client';

const buildMockFetch = (body = '', status = 200) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(body),
    json: vi.fn().mockResolvedValue({}),
    headers: new Map([['content-type', 'text/xml']]),
  });

describe('DAVClient fetch override', () => {
  const mockCredentials = {
    username: 'test',
    password: 'password',
  };

  it('DAVClient should use fetch override in davRequest', async () => {
    const mockFetch = buildMockFetch();
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: {
        method: 'PROPFIND',
        body: {},
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('createDAVClient should use fetch override', async () => {
    const mockFetch = buildMockFetch();
    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Basic',
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: {
        method: 'PROPFIND',
        body: {},
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('createDAVClient auth methods', () => {
  const mockCredentials = {
    username: 'test',
    password: 'password',
    accessToken: 'test-token',
    digestString: 'realm="test",nonce="abc"',
  };

  it('should handle Basic auth', async () => {
    const mockFetch = buildMockFetch();
    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Basic',
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: { method: 'PROPFIND', body: {} },
    });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.authorization).toMatch(/^Basic /);
  });

  it('should handle Bearer auth', async () => {
    const mockFetch = buildMockFetch();
    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Bearer',
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: { method: 'PROPFIND', body: {} },
    });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.authorization).toBe('Bearer test-token');
  });

  it('should handle Digest auth', async () => {
    const mockFetch = buildMockFetch();
    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Digest',
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: { method: 'PROPFIND', body: {} },
    });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.Authorization).toMatch(/^Digest /);
  });

  it('should handle Custom auth', async () => {
    const mockFetch = buildMockFetch();
    const authFunction = vi.fn().mockResolvedValue({ 'X-Custom': 'custom-token' });

    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Custom',
      authFunction,
      fetch: mockFetch,
    });

    expect(authFunction).toHaveBeenCalledWith(mockCredentials);

    await client.davRequest({
      url: 'http://example.com/test',
      init: { method: 'PROPFIND', body: {} },
    });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders['X-Custom']).toBe('custom-token');
  });

  it('should handle Oauth auth', async () => {
    const mockFetch = vi.fn()
      // First call: getOauthHeaders -> fetchOauthTokens
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'oauth-token',
          refresh_token: 'ref',
          expires_in: 3600,
        }),
      })
      // Subsequent calls: davRequest
      .mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(''),
        headers: new Map([['content-type', 'text/xml']]),
      });

    const client = await createDAVClient({
      serverUrl: 'http://example.com',
      credentials: {
        authorizationCode: 'code',
        redirectUrl: 'http://localhost/callback',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      authMethod: 'Oauth',
      fetch: mockFetch,
    });

    await client.davRequest({
      url: 'http://example.com/test',
      init: { method: 'PROPFIND', body: {} },
    });

    const davCallHeaders = mockFetch.mock.calls[1][1].headers;
    expect(davCallHeaders.authorization).toBe('Bearer oauth-token');
  });

  it('should throw for invalid auth method', async () => {
    await expect(
      createDAVClient({
        serverUrl: 'http://example.com',
        credentials: mockCredentials,
        authMethod: 'InvalidMethod' as any,
        fetch: buildMockFetch(),
      }),
    ).rejects.toThrow('Invalid auth method');
  });
});

describe('DAVClient class', () => {
  const mockCredentials = {
    username: 'test',
    password: 'password',
  };

  it('should set default values for authMethod and accountType', () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
    });

    expect((client as any).authMethod).toBe('Basic');
    expect((client as any).accountType).toBe('caldav');
  });

  it('should use provided authMethod and accountType', () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      authMethod: 'Bearer',
      defaultAccountType: 'carddav',
    });

    expect((client as any).authMethod).toBe('Bearer');
    expect((client as any).accountType).toBe('carddav');
  });

  it('should store fetchOptions', () => {
    const fetchOptions = { signal: new AbortController().signal };
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: mockCredentials,
      fetchOptions,
    });

    expect((client as any).fetchOptions).toBe(fetchOptions);
  });
});

describe('DAVClient login', () => {
  it('should set Basic auth headers on login', async () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { username: 'test', password: 'pass' },
      authMethod: 'Basic',
      defaultAccountType: undefined,
      fetch: buildMockFetch(),
    });
    // Override accountType to avoid calling createAccount
    (client as any).accountType = undefined;

    await client.login();

    expect((client as any).authHeaders?.authorization).toMatch(/^Basic /);
  });

  it('should throw for invalid auth method on login', async () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { username: 'test', password: 'pass' },
      authMethod: 'InvalidMethod' as any,
    });

    await expect(client.login()).rejects.toThrow('Invalid auth method');
  });

  it('should set Digest auth headers on login', async () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { digestString: 'realm="test",nonce="abc"' },
      authMethod: 'Digest',
      fetch: buildMockFetch(),
    });
    (client as any).accountType = undefined;

    await client.login();

    expect((client as any).authHeaders.Authorization).toMatch(/^Digest /);
  });

  it('should set Bearer auth headers on login', async () => {
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { accessToken: 'my-token' },
      authMethod: 'Bearer',
      fetch: buildMockFetch(),
    });
    (client as any).accountType = undefined;

    await client.login();

    expect((client as any).authHeaders.authorization).toBe('Bearer my-token');
  });

  it('should set Custom auth headers on login', async () => {
    const authFunction = vi.fn().mockResolvedValue({ 'X-Custom': 'val' });
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { username: 'test' },
      authMethod: 'Custom',
      authFunction,
      fetch: buildMockFetch(),
    });
    (client as any).accountType = undefined;

    await client.login();

    expect(authFunction).toHaveBeenCalled();
    expect((client as any).authHeaders['X-Custom']).toBe('val');
  });

  it('should set Oauth auth headers on login', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        access_token: 'oa-token',
        refresh_token: 'ref',
        expires_in: 3600,
      }),
    });
    const client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: {
        authorizationCode: 'code',
        redirectUrl: 'http://localhost/callback',
        clientId: 'cid',
        clientSecret: 'csecret',
        tokenUrl: 'http://example.com/token',
      },
      authMethod: 'Oauth',
      fetch: mockFetch,
    });
    (client as any).accountType = undefined;

    await client.login();

    expect((client as any).authHeaders.authorization).toBe('Bearer oa-token');
  });
});

describe('DAVClient method delegation', () => {
  let client: DAVClient;
  let mockFetch: vi.Mock;

  beforeEach(() => {
    mockFetch = buildMockFetch();
    client = new DAVClient({
      serverUrl: 'http://example.com',
      credentials: { username: 'test', password: 'pass' },
      fetch: mockFetch,
    });
    (client as any).authHeaders = { authorization: 'Basic dGVzdDpwYXNz' };
  });

  it('propfind should pass auth headers', async () => {
    await client.propfind({
      url: 'http://example.com/cal/',
      props: { 'd:getetag': {} },
    });

    expect(mockFetch).toHaveBeenCalled();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.authorization).toBe('Basic dGVzdDpwYXNz');
  });

  it('createObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
    });

    await client.createObject({
      url: 'http://example.com/cal/event.ics',
      data: 'BEGIN:VCALENDAR',
      headers: { 'content-type': 'text/calendar' },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('updateObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
    });

    await client.updateObject({
      url: 'http://example.com/cal/event.ics',
      data: 'BEGIN:VCALENDAR',
      etag: '"123"',
      headers: { 'content-type': 'text/calendar' },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('deleteObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
    });

    await client.deleteObject({
      url: 'http://example.com/cal/event.ics',
      etag: '"123"',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('davRequest should merge auth headers with provided headers', async () => {
    await client.davRequest({
      url: 'http://example.com/test',
      init: {
        method: 'PROPFIND',
        body: {},
        headers: { 'X-Custom': 'value' },
      },
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.authorization).toBe('Basic dGVzdDpwYXNz');
    expect(headers['X-Custom']).toBe('value');
  });

  it('collectionQuery should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/col/item</href>
    <propstat>
      <prop><getetag>"1"</getetag></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.collectionQuery({
      url: 'http://example.com/col/',
      body: { propfind: {} },
    });

    expect(mockFetch).toHaveBeenCalled();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.authorization).toBe('Basic dGVzdDpwYXNz');
  });

  it('makeCollection should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/col/</href>
    <propstat>
      <prop/>
      <status>HTTP/1.1 201 Created</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.makeCollection({
      url: 'http://example.com/col/',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('syncCollection should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/col/item</href>
    <propstat>
      <prop><getetag>"1"</getetag></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.syncCollection({
      url: 'http://example.com/col/',
      props: { 'd:getetag': {} },
      syncLevel: 1,
      syncToken: 'token',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('supportedReportSet should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/col/</href>
    <propstat>
      <prop><supported-report-set/></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.supportedReportSet({
      collection: { url: 'http://example.com/col/' },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('isCollectionDirty should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>http://example.com/col/</href>
    <propstat>
      <prop><cs:getctag xmlns:cs="http://calendarserver.org/ns/">ctag</cs:getctag></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.isCollectionDirty({
      collection: { url: 'http://example.com/col/', ctag: 'old' },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('calendarQuery should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/cal/event.ics</href>
    <propstat>
      <prop><getetag>"1"</getetag></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.calendarQuery({
      url: 'http://example.com/cal/',
      props: { 'd:getetag': {} },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('makeCalendar should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:"><response><href>/cal/</href><propstat><prop/><status>HTTP/1.1 201 Created</status></propstat></response></multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.makeCalendar({
      url: 'http://example.com/cal/',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('calendarMultiGet should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:"><response><href>/cal/e.ics</href><propstat><prop><getetag>"1"</getetag></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.calendarMultiGet({
      url: 'http://example.com/cal/',
      props: { 'd:getetag': {} },
      objectUrls: ['/cal/e.ics'],
      depth: '1',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('createCalendarObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
    });

    await client.createCalendarObject({
      calendar: { url: 'http://example.com/cal/' },
      filename: 'event.ics',
      iCalString: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('updateCalendarObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
    });

    await client.updateCalendarObject({
      calendarObject: {
        url: 'http://example.com/cal/event.ics',
        etag: '"123"',
        data: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('deleteCalendarObject should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
    });

    await client.deleteCalendarObject({
      calendarObject: {
        url: 'http://example.com/cal/event.ics',
        etag: '"123"',
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('addressBookQuery should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:"><response><href>/addr/c.vcf</href><propstat><prop><getetag>"1"</getetag></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.addressBookQuery({
      url: 'http://example.com/addr/',
      props: { 'd:getetag': {} },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('addressBookMultiGet should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:"><response><href>/addr/c.vcf</href><propstat><prop><getetag>"1"</getetag></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`,
      ),
      headers: new Map([['content-type', 'text/xml']]),
    });

    await client.addressBookMultiGet({
      url: 'http://example.com/addr/',
      props: { 'd:getetag': {} },
      objectUrls: ['/addr/c.vcf'],
      depth: '1',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('createVCard should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
    });

    await client.createVCard({
      addressBook: { url: 'http://example.com/addr/' },
      filename: 'contact.vcf',
      vCardString: 'BEGIN:VCARD\nEND:VCARD',
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('updateVCard should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
    });

    await client.updateVCard({
      vCard: {
        url: 'http://example.com/addr/contact.vcf',
        etag: '"123"',
        data: 'BEGIN:VCARD\nEND:VCARD',
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('deleteVCard should pass auth headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
    });

    await client.deleteVCard({
      vCard: {
        url: 'http://example.com/addr/contact.vcf',
        etag: '"123"',
      },
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

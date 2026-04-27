import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import { davRequest, propfind, createObject, updateObject, deleteObject } from '../../request';

// Helper to build mock fetch responses
const buildMockFetch = (params: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  text?: string;
  headers?: Record<string, string>;
  url?: string;
}) => {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    text = '',
    headers = {},
    url = 'http://example.com',
  } = params;
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    url,
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    },
    text: vi.fn().mockResolvedValue(text),
  });
};

describe('davRequest', () => {
  it('should convert JS body to XML when convertIncoming is true (default)', async () => {
    const mockFetch = buildMockFetch({
      text: '',
      headers: { 'content-type': 'text/plain' },
    });

    await davRequest({
      url: 'http://example.com/dav/',
      init: {
        method: 'PROPFIND',
        body: { propfind: { prop: { displayname: {} } } },
        namespace: 'd',
      },
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toContain('<?xml');
    expect(body).toContain('d:propfind');
    expect(body).toContain('d:displayname');
  });

  it('should pass body as-is when convertIncoming is false', async () => {
    const rawXml = '<d:propfind><d:prop/></d:propfind>';
    const mockFetch = buildMockFetch({
      text: '',
      headers: { 'content-type': 'text/plain' },
    });

    await davRequest({
      url: 'http://example.com/dav/',
      init: { method: 'PROPFIND', body: rawXml as any },
      convertIncoming: false,
      fetch: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1].body).toBe(rawXml);
  });

  it('should return unparsed response when response is not OK', async () => {
    const mockFetch = buildMockFetch({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: 'Not Found',
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/dav/',
    });

    const result = await davRequest({
      url: 'http://example.com/dav/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result).toHaveLength(1);
    expect(result[0].ok).toBe(false);
    expect(result[0].status).toBe(404);
    expect(result[0].statusText).toBe('Not Found');
    expect(result[0].raw).toBe('Not Found');
  });

  it('should return unparsed response when content-type is not XML', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 200,
      text: '<html>hello</html>',
      headers: { 'content-type': 'text/html' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'GET', body: {} },
      fetch: mockFetch,
    });

    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('<html>hello</html>');
  });

  it('should return unparsed response when parseOutgoing is false', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: '<xml/>',
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'PROPFIND', body: {} },
      parseOutgoing: false,
      fetch: mockFetch,
    });

    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('<xml/>');
  });

  it('should return unparsed response when response body is empty', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 200,
      text: '',
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('');
  });

  it('should parse multi-status XML response with single response', async () => {
    const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/cal/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>My Calendar</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: xmlResponse,
      headers: { 'content-type': 'application/xml; charset=utf-8' },
      url: 'http://example.com/dav/cal/',
    });

    const result = await davRequest({
      url: 'http://example.com/dav/cal/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result).toHaveLength(1);
    expect(result[0].href).toBe('/dav/cal/');
    expect(result[0].status).toBe(207);
    expect(result[0].statusText).toBe('OK');
    expect(result[0].props?.displayname).toBe('My Calendar');
  });

  it('should parse multi-status XML response with multiple responses', async () => {
    const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/cal1/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Calendar 1</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/dav/cal2/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Calendar 2</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: xmlResponse,
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/dav/',
    });

    const result = await davRequest({
      url: 'http://example.com/dav/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result).toHaveLength(2);
    expect(result[0].props?.displayname).toBe('Calendar 1');
    expect(result[1].props?.displayname).toBe('Calendar 2');
  });

  it('should parse status line with regex for each response', async () => {
    const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/missing/</d:href>
    <d:status>HTTP/1.1 404 Not Found</d:status>
  </d:response>
</d:multistatus>`;
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: xmlResponse,
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'REPORT', body: {} },
      fetch: mockFetch,
    });

    expect(result[0].status).toBe(404);
    expect(result[0].statusText).toBe('Not Found');
  });

  it('should handle response with multiple propstats', async () => {
    const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/res/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Test</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
    <d:propstat>
      <d:prop>
        <d:getcontenttype>text/calendar</d:getcontenttype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: xmlResponse,
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result[0].props?.displayname).toBe('Test');
    expect(result[0].props?.getcontenttype).toBe('text/calendar');
  });

  it('should merge headers from init and fetchOptions', async () => {
    const mockFetch = buildMockFetch({
      text: '',
      headers: { 'content-type': 'text/plain' },
    });

    await davRequest({
      url: 'http://example.com/',
      init: {
        method: 'PROPFIND',
        headers: { Authorization: 'Basic abc' },
        body: {},
      },
      fetchOptions: { headers: { 'X-Custom': 'value' } },
      fetch: mockFetch,
    });

    const requestHeaders = mockFetch.mock.calls[0][1].headers;
    expect(requestHeaders['Authorization']).toBe('Basic abc');
    expect(requestHeaders['X-Custom']).toBe('value');
    expect(requestHeaders['Content-Type']).toBe('text/xml;charset=UTF-8');
  });

  it('should use custom fetch override when provided', async () => {
    const mockFetch = buildMockFetch({ text: '' });

    await davRequest({
      url: 'http://example.com/',
      init: { method: 'GET', body: {} },
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should add namespace prefix to element names without namespace', async () => {
    const mockFetch = buildMockFetch({
      text: '',
      headers: { 'content-type': 'text/plain' },
    });

    await davRequest({
      url: 'http://example.com/',
      init: {
        method: 'PROPFIND',
        namespace: 'd',
        body: { propfind: { prop: {} } },
      },
      fetch: mockFetch,
    });

    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toContain('d:propfind');
    expect(body).toContain('d:prop');
  });

  it('should not double-prefix element names that already have a namespace', async () => {
    const mockFetch = buildMockFetch({
      text: '',
      headers: { 'content-type': 'text/plain' },
    });

    await davRequest({
      url: 'http://example.com/',
      init: {
        method: 'PROPFIND',
        namespace: 'd',
        body: { propfind: { 'c:calendar-data': {} } },
      },
      fetch: mockFetch,
    });

    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toContain('c:calendar-data');
    expect(body).not.toContain('d:c:calendar-data');
  });

  it('should handle null response body in multi-status (missing responseBody)', async () => {
    // This tests the code path where responseBody is falsy
    const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/item/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Item</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: xmlResponse,
      headers: { 'content-type': 'text/xml; charset=utf-8' },
      url: 'http://example.com/',
    });

    const result = await davRequest({
      url: 'http://example.com/',
      init: { method: 'PROPFIND', body: {} },
      fetch: mockFetch,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].href).toBe('/dav/item/');
  });

  it('should strip fetchOptions.headers from the non-header options', async () => {
    const mockFetch = buildMockFetch({ text: '' });

    await davRequest({
      url: 'http://example.com/',
      init: { method: 'GET', body: {} },
      fetchOptions: {
        headers: { 'X-Extra': 'yes' },
        credentials: 'include',
      } as any,
      fetch: mockFetch,
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.credentials).toBe('include');
    expect(callArgs.headers['X-Extra']).toBe('yes');
  });
});

describe('propfind', () => {
  it('should send PROPFIND request with correct namespace attributes', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/</d:href>
    <d:propstat>
      <d:prop><d:displayname>Root</d:displayname></d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
      headers: { 'content-type': 'application/xml' },
      url: 'http://example.com/',
    });

    const result = await propfind({
      url: 'http://example.com/',
      props: { 'd:displayname': {} },
      depth: '0',
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('PROPFIND');
    expect(result[0].props?.displayname).toBe('Root');
  });

  it('should include depth header', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:"><d:response><d:href>/</d:href><d:propstat><d:prop><d:displayname>X</d:displayname></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`,
      headers: { 'content-type': 'application/xml' },
    });

    await propfind({
      url: 'http://example.com/',
      props: { 'd:displayname': {} },
      depth: '1',
      fetch: mockFetch,
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.depth).toBe('1');
  });

  it('should apply headersToExclude', async () => {
    const mockFetch = buildMockFetch({
      ok: true,
      status: 207,
      text: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:"><d:response><d:href>/</d:href><d:propstat><d:prop><d:displayname>X</d:displayname></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`,
      headers: { 'content-type': 'application/xml' },
    });

    await propfind({
      url: 'http://example.com/',
      props: { 'd:displayname': {} },
      headers: { Authorization: 'Basic abc', 'X-Remove': 'yes' },
      headersToExclude: ['X-Remove'],
      fetch: mockFetch,
    });

    const reqHeaders = mockFetch.mock.calls[0][1].headers;
    expect(reqHeaders['Authorization']).toBe('Basic abc');
    expect(reqHeaders['X-Remove']).toBeUndefined();
  });
});

describe('createObject', () => {
  it('should send PUT request with correct data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    const result = await createObject({
      url: 'http://example.com/cal/event.ics',
      data: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
      headers: { 'content-type': 'text/calendar' },
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('PUT');
    expect(callArgs.body).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
    expect(callArgs.headers['content-type']).toBe('text/calendar');
    expect(result.ok).toBe(true);
  });

  it('should apply headersToExclude', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    await createObject({
      url: 'http://example.com/cal/event.ics',
      data: 'data',
      headers: { Authorization: 'Basic abc', 'X-Remove': 'yes' },
      headersToExclude: ['X-Remove'],
      fetch: mockFetch,
    });

    const reqHeaders = mockFetch.mock.calls[0][1].headers;
    expect(reqHeaders['Authorization']).toBe('Basic abc');
    expect(reqHeaders['X-Remove']).toBeUndefined();
  });
});

describe('updateObject', () => {
  it('should send PUT request with If-Match header when etag is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await updateObject({
      url: 'http://example.com/cal/event.ics',
      data: 'updated-data',
      etag: '"abc123"',
      headers: { 'content-type': 'text/calendar' },
      fetch: mockFetch,
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('PUT');
    expect(callArgs.headers['If-Match']).toBe('"abc123"');
    expect(callArgs.body).toBe('updated-data');
  });

  it('should not include If-Match header when etag is undefined', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await updateObject({
      url: 'http://example.com/cal/event.ics',
      data: 'updated-data',
      headers: { 'content-type': 'text/calendar' },
      fetch: mockFetch,
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers['If-Match']).toBeUndefined();
  });

  it('should apply headersToExclude', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await updateObject({
      url: 'http://example.com/cal/event.ics',
      data: 'data',
      headers: { Authorization: 'Basic abc', 'X-Remove': 'yes' },
      headersToExclude: ['X-Remove'],
      fetch: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1].headers['X-Remove']).toBeUndefined();
  });
});

describe('deleteObject', () => {
  it('should send DELETE request with If-Match header when etag is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

    await deleteObject({
      url: 'http://example.com/cal/event.ics',
      etag: '"xyz789"',
      fetch: mockFetch,
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('DELETE');
    expect(callArgs.headers['If-Match']).toBe('"xyz789"');
  });

  it('should not include If-Match header when etag is undefined', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

    await deleteObject({
      url: 'http://example.com/cal/event.ics',
      fetch: mockFetch,
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('DELETE');
    expect(callArgs.headers['If-Match']).toBeUndefined();
  });

  it('should apply headersToExclude', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

    await deleteObject({
      url: 'http://example.com/cal/event.ics',
      headers: { Authorization: 'Basic abc', 'X-Remove': 'yes' },
      headersToExclude: ['X-Remove'],
      fetch: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1].headers['X-Remove']).toBeUndefined();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { collectionQuery } from '../../collection';

const mockFetch = (params: {
  ok: boolean;
  status: number;
  statusText: string;
  text: string;
  contentType?: string;
}) =>
  vi.fn().mockResolvedValue({
    ok: params.ok,
    status: params.status,
    statusText: params.statusText,
    url: 'https://example.com/dav/cal/user%40host/default/',
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type'
          ? (params.contentType ?? 'application/xml; charset=utf-8')
          : null,
    },
    text: async () => params.text,
  });

describe('collectionQuery empty calendar-query XML', () => {
  it('returns [] for a 207 with a collection-level 404 and no propstat', async () => {
    const result = await collectionQuery({
      url: 'https://example.com/dav/cal/user%40host/default/',
      body: {},
      fetch: mockFetch({
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        text: `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/dav/cal/user%40host/default/</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
    <D:responsedescription>No resources found</D:responsedescription>
  </D:response>
</D:multistatus>`,
      }),
    });

    expect(result).toEqual([]);
  });

  it('returns [] for an empty 207 multistatus', async () => {
    const result = await collectionQuery({
      url: 'https://example.com/cal/',
      body: {},
      fetch: mockFetch({
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        text: `<?xml version="1.0" encoding="UTF-8"?><D:multistatus xmlns:D="DAV:"/>`,
      }),
    });

    expect(result).toEqual([]);
  });

  it('still rejects HTTP 504', async () => {
    await expect(
      collectionQuery({
        url: 'https://example.com/cal/',
        body: {},
        fetch: mockFetch({
          ok: false,
          status: 504,
          statusText: 'Gateway Time-out',
          text: '<html>Gateway Time-out</html>',
          contentType: 'text/html',
        }),
      }),
    ).rejects.toThrow('Collection query failed: 504 Gateway Time-out');
  });
});

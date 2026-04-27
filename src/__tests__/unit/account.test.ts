import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from '../../account';

const buildResponse = (params: {
  status: number;
  statusText?: string;
  body?: string;
  headers?: Record<string, string>;
  url: string;
}) => {
  const { status, statusText = '', body = '', headers = {}, url } = params;
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    url,
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    },
    text: vi.fn().mockResolvedValue(body),
  };
};

describe('account discovery fallback', () => {
  it('createAccount should fall back when service discovery returns an unusable root', async () => {
    const serverUrl = 'https://example.com/calendars/test-user/calendar-id/';
    const discoveredRootUrl = 'https://example.com/index.php/';
    const fallbackRootUrl = 'https://example.com/';
    const principalUrl = 'https://example.com/principals/test-user/';
    const homeUrl = 'https://example.com/calendars/test-user/';
    const mockFetch = vi.fn(async (url: string) => {
      if (url === 'https://example.com/.well-known/caldav') {
        return buildResponse({
          status: 307,
          statusText: 'Temporary Redirect',
          headers: {
            Location: discoveredRootUrl,
          },
          url,
        });
      }

      if (url === discoveredRootUrl) {
        return buildResponse({
          status: 401,
          statusText: 'Unauthorized',
          body: '<d:error xmlns:d="DAV:" />',
          headers: {
            'content-type': 'application/xml; charset=utf-8',
          },
          url,
        });
      }

      if (url === serverUrl) {
        return buildResponse({
          status: 404,
          statusText: 'Not Found',
          body: '<d:error xmlns:d="DAV:" />',
          headers: {
            'content-type': 'application/xml; charset=utf-8',
          },
          url,
        });
      }

      if (url === fallbackRootUrl) {
        return buildResponse({
          status: 207,
          statusText: 'Multi-Status',
          body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/</d:href>
    <d:propstat>
      <d:prop>
        <d:current-user-principal>
          <d:href>/principals/test-user/</d:href>
        </d:current-user-principal>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
          },
          url,
        });
      }

      if (url === principalUrl) {
        return buildResponse({
          status: 207,
          statusText: 'Multi-Status',
          body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/principals/test-user/</d:href>
    <d:propstat>
      <d:prop>
        <cal:calendar-home-set>
          <d:href>/calendars/test-user/</d:href>
        </cal:calendar-home-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
          },
          url,
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const account = await createAccount({
      account: {
        serverUrl,
        accountType: 'caldav',
      },
      headers: {
        authorization: 'Basic test',
      },
      fetch: mockFetch as any,
    });

    expect(account.rootUrl).toEqual(fallbackRootUrl);
    expect(account.principalUrl).toEqual(principalUrl);
    expect(account.homeUrl).toEqual(homeUrl);
  });
});

describe('serviceDiscovery', () => {
  it('should follow redirect from PROPFIND', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 301,
      headers: new Map([['Location', '/dav/']]),
    });

    const url = await serviceDiscovery({
      account: { serverUrl: 'https://example.com/calendars/user1/', accountType: 'caldav' },
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
      fetch: mockFetch,
    });

    expect(url).toBe('https://example.com/dav/');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1].method).toBe('PROPFIND');
  });

  it('should try GET when PROPFIND does not redirect', async () => {
    const mockFetch = vi
      .fn()
      // PROPFIND returns 200 (no redirect)
      .mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
      })
      // GET returns a redirect
      .mockResolvedValueOnce({
        status: 301,
        headers: new Map([['Location', '/dav/']]),
      });

    const url = await serviceDiscovery({
      account: { serverUrl: 'https://example.com/', accountType: 'caldav' },
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
      fetch: mockFetch,
    });

    expect(url).toBe('https://example.com/dav/');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][1].method).toBe('PROPFIND');
    expect(mockFetch.mock.calls[1][1].method).toBe('GET');
  });

  it('should fall back to server URL when both PROPFIND and GET fail', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 404, headers: new Map() })
      .mockResolvedValueOnce({ status: 404, headers: new Map() });

    const url = await serviceDiscovery({
      account: {
        serverUrl: 'https://example.com/calendars/user1/cal1/',
        accountType: 'caldav',
      },
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
      fetch: mockFetch,
    });

    expect(url).toBe('https://example.com/calendars/user1/cal1/');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('createAccount', () => {
  it('should skip service discovery when rootUrl is pre-set', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 207,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0" encoding="utf-8"?>
        <d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
          <d:response>
            <d:href>/dav/</d:href>
            <d:propstat>
              <d:prop>
                <d:current-user-principal>
                  <d:href>/dav/principals/user1/</d:href>
                </d:current-user-principal>
              </d:prop>
              <d:status>HTTP/1.1 200 OK</d:status>
            </d:propstat>
          </d:response>
        </d:multistatus>`,
      ),
      headers: new Map([['content-type', 'application/xml']]),
    });

    const account = await createAccount({
      account: {
        serverUrl: 'https://example.com/calendars/user1/cal1/',
        rootUrl: 'https://example.com/dav/',
        principalUrl: 'https://example.com/dav/principals/user1/',
        homeUrl: 'https://example.com/dav/calendars/user1/',
        accountType: 'caldav',
      },
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
      fetch: mockFetch,
    });

    // No fetch calls should be made since all URLs are pre-set
    expect(mockFetch).not.toHaveBeenCalled();
    expect(account.rootUrl).toBe('https://example.com/dav/');
    expect(account.principalUrl).toBe('https://example.com/dav/principals/user1/');
    expect(account.homeUrl).toBe('https://example.com/dav/calendars/user1/');
  });

  it('should skip only the steps for which URLs are provided', async () => {
    // Provide rootUrl but not principalUrl or homeUrl
    // fetchPrincipalUrl will be called (PROPFIND on rootUrl)
    // fetchHomeUrl will be called (PROPFIND on principalUrl)
    const mockFetch = vi
      .fn()
      // fetchPrincipalUrl PROPFIND
      .mockResolvedValueOnce({
        ok: true,
        status: 207,
        text: vi.fn().mockResolvedValue(
          `<?xml version="1.0" encoding="utf-8"?>
          <d:multistatus xmlns:d="DAV:">
            <d:response>
              <d:href>/dav/</d:href>
              <d:propstat>
                <d:prop>
                  <d:current-user-principal>
                    <d:href>/dav/principals/user1/</d:href>
                  </d:current-user-principal>
                </d:prop>
                <d:status>HTTP/1.1 200 OK</d:status>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
        ),
        headers: new Map([['content-type', 'application/xml']]),
      })
      // fetchHomeUrl PROPFIND
      .mockResolvedValueOnce({
        ok: true,
        status: 207,
        text: vi.fn().mockResolvedValue(
          `<?xml version="1.0" encoding="utf-8"?>
          <d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
            <d:response>
              <d:href>/dav/principals/user1/</d:href>
              <d:propstat>
                <d:prop>
                  <cal:calendar-home-set>
                    <d:href>/dav/calendars/user1/</d:href>
                  </cal:calendar-home-set>
                </d:prop>
                <d:status>HTTP/1.1 200 OK</d:status>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
        ),
        headers: new Map([['content-type', 'application/xml']]),
      });

    const account = await createAccount({
      account: {
        serverUrl: 'https://example.com/calendars/user1/cal1/',
        rootUrl: 'https://example.com/dav/',
        accountType: 'caldav',
      },
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
      fetch: mockFetch,
    });

    // Service discovery should NOT have been called (rootUrl is pre-set)
    // But fetchPrincipalUrl and fetchHomeUrl should have been called
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(account.rootUrl).toBe('https://example.com/dav/');
    expect(account.principalUrl).toBe('https://example.com/dav/principals/user1/');
    expect(account.homeUrl).toBe('https://example.com/dav/calendars/user1/');
  });
});

describe('fetchPrincipalUrl', () => {
  const buildResponse = (params: {
    status: number;
    statusText?: string;
    body?: string;
    headers?: Record<string, string>;
    url?: string;
  }) => {
    const { status, statusText = '', body = '', headers = {}, url = '' } = params;
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText,
      url,
      headers: {
        get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
      },
      text: vi.fn().mockResolvedValue(body),
    };
  };

  it('should return principal URL from propfind response', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 207,
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/</d:href>
    <d:propstat>
      <d:prop>
        <d:current-user-principal>
          <d:href>/principals/user1/</d:href>
        </d:current-user-principal>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
        headers: { 'content-type': 'application/xml' },
      }),
    );

    const result = await fetchPrincipalUrl({
      account: {
        serverUrl: 'https://example.com/',
        rootUrl: 'https://example.com/dav/',
        accountType: 'caldav',
      },
      fetch: mockFetch,
    });

    expect(result).toBe('https://example.com/principals/user1/');
  });

  it('should throw when account is missing rootUrl', async () => {
    const mockFetch = vi.fn();

    await expect(
      fetchPrincipalUrl({
        account: {
          serverUrl: 'https://example.com/',
          accountType: 'caldav',
        },
        fetch: mockFetch,
      }),
    ).rejects.toThrow('account must have rootUrl before fetchPrincipalUrl');
  });

  it('should throw when propfind returns 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 401,
        statusText: 'Unauthorized',
        body: 'Unauthorized',
        headers: { 'content-type': 'text/plain' },
      }),
    );

    await expect(
      fetchPrincipalUrl({
        account: {
          serverUrl: 'https://example.com/',
          rootUrl: 'https://example.com/dav/',
          accountType: 'caldav',
        },
        fetch: mockFetch,
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw when propfind response is missing principal href', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 207,
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/dav/</d:href>
    <d:propstat>
      <d:prop>
        <d:current-user-principal/>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
        headers: { 'content-type': 'application/xml' },
      }),
    );

    await expect(
      fetchPrincipalUrl({
        account: {
          serverUrl: 'https://example.com/',
          rootUrl: 'https://example.com/dav/',
          accountType: 'caldav',
        },
        fetch: mockFetch,
      }),
    ).rejects.toThrow('cannot find principalUrl');
  });
});

describe('fetchHomeUrl', () => {
  const buildResponse = (params: {
    status: number;
    body?: string;
    headers?: Record<string, string>;
    url?: string;
  }) => {
    const { status, body = '', headers = {}, url = '' } = params;
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 207 ? 'Multi-Status' : 'Error',
      url,
      headers: {
        get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
      },
      text: vi.fn().mockResolvedValue(body),
    };
  };

  it('should return home URL for caldav account', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 207,
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/principals/user1/</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-home-set>
          <d:href>/calendars/user1/</d:href>
        </c:calendar-home-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
        headers: { 'content-type': 'application/xml' },
      }),
    );

    const result = await fetchHomeUrl({
      account: {
        serverUrl: 'https://example.com/',
        rootUrl: 'https://example.com/',
        principalUrl: 'https://example.com/principals/user1/',
        accountType: 'caldav',
      },
      fetch: mockFetch,
    });

    expect(result).toBe('https://example.com/calendars/user1/');
  });

  it('should return home URL for carddav account', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 207,
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/principals/user1/</d:href>
    <d:propstat>
      <d:prop>
        <card:addressbook-home-set>
          <d:href>/addressbooks/user1/</d:href>
        </card:addressbook-home-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
        headers: { 'content-type': 'application/xml' },
      }),
    );

    const result = await fetchHomeUrl({
      account: {
        serverUrl: 'https://example.com/',
        rootUrl: 'https://example.com/',
        principalUrl: 'https://example.com/principals/user1/',
        accountType: 'carddav',
      },
      fetch: mockFetch,
    });

    expect(result).toBe('https://example.com/addressbooks/user1/');
  });

  it('should throw when account is missing principalUrl', async () => {
    await expect(
      fetchHomeUrl({
        account: {
          serverUrl: 'https://example.com/',
          rootUrl: 'https://example.com/',
          accountType: 'caldav',
        },
        fetch: vi.fn(),
      }),
    ).rejects.toThrow('account must have principalUrl before fetchHomeUrl');
  });

  it('should throw when propfind response has no match', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      buildResponse({
        status: 207,
        body: `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/other/</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-home-set>
          <d:href>/calendars/user1/</d:href>
        </c:calendar-home-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`,
        headers: { 'content-type': 'application/xml' },
      }),
    );

    await expect(
      fetchHomeUrl({
        account: {
          serverUrl: 'https://example.com/',
          rootUrl: 'https://example.com/',
          principalUrl: 'https://example.com/principals/user1/',
          accountType: 'caldav',
        },
        fetch: mockFetch,
      }),
    ).rejects.toThrow('cannot find homeUrl');
  });
});

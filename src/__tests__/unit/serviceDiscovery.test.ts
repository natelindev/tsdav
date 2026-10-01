import { describe, expect, it, vi } from 'vitest';
import { serviceDiscovery } from '../../account';
import { createDAVClient, DAVClient } from '../../client';

describe('discovery redirect authorities', () => {
  describe.each(['PROPFIND', 'GET'])('%s redirects', (method) => {
    it.each([
      ['../dav/', 'https://example.com:8443/dav/'],
      ['/dav/', 'https://example.com:8443/dav/'],
      ['https://example.com/dav/', 'https://example.com/dav/'],
      ['https://example.com:443/dav/', 'https://example.com/dav/'],
      ['http://example.com/dav/', 'http://example.com/dav/'],
      ['//example.com/dav/', 'https://example.com/dav/'],
      ['https://example.com:9443/dav/', 'https://example.com:9443/dav/'],
      ['//other.example.com/dav/', 'https://other.example.com/dav/'],
    ])('honors the authority in Location %s', async (location, expected) => {
      const mockFetch = vi.fn<typeof globalThis.fetch>(
        async (_url, init = {}) =>
          new Response(null, {
            status: init.method === method ? 301 : 405,
            headers: init.method === method ? { Location: location } : {},
          }),
      );
      expect(
        await serviceDiscovery({
          account: {
            serverUrl: 'https://example.com:8443/calendars/user1/',
            accountType: 'caldav',
          },
          fetch: mockFetch,
        }),
      ).toBe(expected);
      expect(mockFetch).toHaveBeenCalledTimes(method === 'GET' ? 2 : 1);
    });
  });
});

describe('discovery GET fallback', () => {
  it.each(['helper', 'factory', 'class'])(
    'omits a supplied body and preserves transport options through the %s API',
    async (api) => {
      const mockFetch = vi.fn<typeof globalThis.fetch>(async (url, init = {}) => {
        // Enforce the same GET-body restriction as native fetch without using the network.
        new Request(url, init);
        return new Response(null, {
          status: init.method === 'GET' ? 301 : 405,
          headers: init.method === 'GET' ? { Location: '../dav/' } : {},
        });
      });
      const options = {
        serverUrl: 'https://example.com/calendars/user1/',
        credentials: { username: 'test', password: 'test' },
        fetchOptions: {
          body: 'caller-body',
          headers: new Headers({ 'X-Custom': 'value' }),
          credentials: 'include' as const,
        },
        fetch: mockFetch,
      };
      const account = {
        serverUrl: options.serverUrl,
        accountType: 'caldav' as const,
        principalUrl: 'https://example.com/principals/user1/',
        homeUrl: 'https://example.com/calendars/user1/',
      };
      let rootUrl: string | undefined;
      if (api === 'helper') {
        rootUrl = await serviceDiscovery({
          account,
          fetchOptions: options.fetchOptions,
          fetch: mockFetch,
        });
      } else {
        const client = api === 'factory' ? await createDAVClient(options) : new DAVClient(options);
        rootUrl = (await client.createAccount({ account })).rootUrl;
      }
      expect(rootUrl).toBe('https://example.com/dav/');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const init = mockFetch.mock.calls[1][1];
      expect(init).toMatchObject({ method: 'GET', redirect: 'manual', credentials: 'include' });
      expect(init?.body).toBeUndefined();
      expect(new Headers(init?.headers).get('x-custom')).toBe('value');
    },
  );
});

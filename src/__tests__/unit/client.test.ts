import { DAVClient, createDAVClient } from '../../client';

describe('DAVClient fetch override', () => {
  const mockCredentials = {
    username: 'test',
    password: 'password',
  };

  it('DAVClient should use fetch override in davRequest', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
      headers: new Map(),
    });

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
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
      headers: new Map(),
    });

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

import { collectionQuery } from '../../collection';
import * as request from '../../request';

jest.mock('../../request');

const mockedDavRequest = request.davRequest as jest.MockedFunction<typeof request.davRequest>;

describe('collectionQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when davRequest returns a 504 error', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 504,
        statusText: 'Gateway Time-out',
        raw: '<html>Gateway Time-out</html>',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 504 Gateway Time-out');
  });

  it('should throw error when davRequest returns a 504 error and empty raw', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 504,
        statusText: 'Gateway Time-out',
        raw: '',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 504 Gateway Time-out');
  });

  it('should throw error when davRequest returns a 401 error', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        raw: 'Unauthorized',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 401 Unauthorized');
  });

  it('should return empty array when queryResults.length === 1, !queryResults[0].raw and status is 200', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: true,
        status: 200,
        statusText: 'OK',
      },
    ]);

    const result = await collectionQuery({
      url: 'http://example.com/cal/',
      body: {},
    });

    expect(result).toEqual([]);
  });

  it('should NOT return empty array when status is >= 400 even if !raw', async () => {
    mockedDavRequest.mockResolvedValue([
      {
        href: 'http://example.com/cal/',
        ok: true, // Suppose ok is true but status is 400 (unlikely but testing the logic)
        status: 400,
        statusText: 'Bad Request',
      },
    ]);

    await expect(
      collectionQuery({
        url: 'http://example.com/cal/',
        body: {},
      }),
    ).rejects.toThrow('Collection query failed: 400 Bad Request');
  });
});

import { fetchVCards } from '../../addressBook';
import * as request from '../../request';

jest.mock('../../request');

const mockedDavRequest = request.davRequest as jest.MockedFunction<typeof request.davRequest>;

describe('fetchVCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle Radicale responses with valid href', async () => {
    // Initial addressBookQuery returns URLs
    mockedDavRequest.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
        },
      },
    ]);

    // addressBookMultiGet returns data
    mockedDavRequest.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          addressData: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEND:VCARD',
        },
      },
    ]);

    const vcards = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(vcards).toHaveLength(1);
    expect(vcards[0].url).toContain('card1.vcf');
    expect(mockedDavRequest).toHaveBeenCalledTimes(2);
  });

  it('should filter out the address book collection itself if returned in query', async () => {
    // Initial addressBookQuery returns URLs including the collection
    mockedDavRequest.mockResolvedValueOnce([
      {
        href: '/user/addr/',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          resourcetype: { addressbook: {}, collection: {} },
        },
      },
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
        },
      },
    ]);

    // addressBookMultiGet returns data
    mockedDavRequest.mockResolvedValueOnce([
      {
        href: '/user/addr/card1.vcf',
        ok: true,
        status: 200,
        statusText: 'OK',
        raw: '<xml/>',
        props: {
          getetag: '"123"',
          addressData: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEND:VCARD',
        },
      },
    ]);

    const vcards = await fetchVCards({
      addressBook: { url: 'http://example.com/user/addr/' },
    });

    expect(vcards).toHaveLength(1);
    expect(vcards[0].url).toContain('card1.vcf');
    expect(vcards[0].url).not.toBe('http://example.com/user/addr/');

    // Check that multi-get was called ONLY with the vcard URL, not the collection URL
    const multiGetCall = mockedDavRequest.mock.calls[1][0];
    const hrefs = multiGetCall.init.body['addressbook-multiget']['d:href'];
    expect(hrefs).toEqual(['/user/addr/card1.vcf']);
  });
});

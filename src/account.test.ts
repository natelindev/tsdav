import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from './account';
import { getBasicAuthHeaders } from './util/authHelper';

test('serviceDiscovery should be able to discover the caldav service', async () => {
  const url = await serviceDiscovery({
    account: { serverUrl: 'https://caldav.icloud.com/', accountType: 'caldav' },
    headers: authHeaders,
  });
  console.log(url);
});

test('fetchPrincipalUrl should be able to fetch the url of principle collection', async () => {
  const url = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://caldav.icloud.com/',
      rootUrl: 'https://caldav.icloud.com/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/https:\/\/.*caldav.icloud.com\/[0-9]+\/principal/);
});

test('fetchHomeUrl should be able to fetch the url of home set', async () => {
  const principalUrl = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://caldav.icloud.com/',
      rootUrl: 'https://caldav.icloud.com/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  const url = await fetchHomeUrl({
    account: {
      principalUrl,
      serverUrl: 'https://caldav.icloud.com/',
      rootUrl: 'https://caldav.icloud.com/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
});

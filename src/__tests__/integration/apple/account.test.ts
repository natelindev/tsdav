import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from '../../../account';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_ICLOUD_USERNAME,
    password: process.env.CREDENTIAL_ICLOUD_APP_SPECIFIC_PASSWORD,
  });
});

test('serviceDiscovery should be able to discover the caldav service', async () => {
  const url = await serviceDiscovery({
    account: { serverUrl: 'https://caldav.icloud.com/', accountType: 'caldav' },
    headers: authHeaders,
  });
  expect(url).toEqual('https://caldav.icloud.com/');
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
  expect(url).toMatch(/https:\/\/p[0-9]+-caldav.icloud.com\/[0-9]+\/calendars/);
});

test('createAccount should be able to create account', async () => {
  const account = await createAccount({
    account: {
      serverUrl: 'https://caldav.icloud.com/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(account.rootUrl).toEqual('https://caldav.icloud.com/');
  expect(account.principalUrl).toMatch(/https:\/\/.*caldav.icloud.com\/[0-9]+\/principal/);
  expect(account.homeUrl).toMatch(/https:\/\/p[0-9]+-caldav.icloud.com\/[0-9]+\/calendars/);
});

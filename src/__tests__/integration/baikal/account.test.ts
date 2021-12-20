import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from '../../../account';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_BAIKAL_USERNAME,
    password: process.env.CREDENTIAL_BAIKAL_PASSWORD,
  });
});

test('serviceDiscovery should be able to discover the caldav service', async () => {
  const url = await serviceDiscovery({
    account: {
      serverUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toEqual(`${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`);
});

test('fetchPrincipalUrl should be able to fetch the url of principal collection', async () => {
  const url = await fetchPrincipalUrl({
    account: {
      serverUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      rootUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/http:\/\/.+\/dav\.php\/principals\/.+\//);
});

test('fetchHomeUrl should be able to fetch the url of home set', async () => {
  const principalUrl = await fetchPrincipalUrl({
    account: {
      serverUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      rootUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  const url = await fetchHomeUrl({
    account: {
      principalUrl,
      serverUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      rootUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/http:\/\/.+\/dav\.php\/calendars\/.+\//);
});

test('createAccount should be able to create account', async () => {
  const account = await createAccount({
    account: {
      serverUrl: `${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(account.rootUrl).toEqual(`${process.env.CREDENTIAL_BAIKAL_SERVER_URL}/dav.php`);
  expect(account.principalUrl).toMatch(/http:\/\/.+\/dav\.php\/principals\/.+\//);
  expect(account.homeUrl).toMatch(/http:\/\/.+\/dav\.php\/calendars\/.+\//);
});

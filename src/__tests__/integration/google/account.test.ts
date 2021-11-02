import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from '../../../account';
import { getOauthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

beforeAll(async () => {
  authHeaders = (
    await getOauthHeaders({
      tokenUrl: 'https://accounts.google.com/o/oauth2/token',
      username: process.env.CREDENTIAL_GOOGLE_USERNAME,
      refreshToken: process.env.CREDENTIAL_GOOGLE_REFRESH_TOKEN,
      clientId: process.env.CREDENTIAL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.CREDENTIAL_GOOGLE_CLIENT_SECRET,
    })
  ).headers;
});

test('serviceDiscovery should be able to discover the caldav service', async () => {
  const url = await serviceDiscovery({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toEqual('https://apidata.googleusercontent.com/caldav/v2/');
});

test('fetchPrincipalUrl should be able to fetch the url of principle collection', async () => {
  const url = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      rootUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/^https:\/\/apidata.googleusercontent.com\/caldav\/v2\/.+\/user$/);
});

test('fetchHomeUrl should be able to fetch the url of home set', async () => {
  const principalUrl = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      rootUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  const url = await fetchHomeUrl({
    account: {
      principalUrl,
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      rootUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/https:\/\/apidata.googleusercontent.com\/caldav\/v2\/.+\//);
});

test('createAccount should be able to create account', async () => {
  const account = await createAccount({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(account.rootUrl).toEqual('https://apidata.googleusercontent.com/caldav/v2/');
  expect(account.principalUrl).toMatch(
    /^https:\/\/apidata.googleusercontent.com\/caldav\/v2\/.+\/user$/
  );
  expect(account.homeUrl).toMatch(/https:\/\/apidata.googleusercontent.com\/caldav\/v2\/.+\//);
});

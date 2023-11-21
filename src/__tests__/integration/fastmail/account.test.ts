import { createAccount, fetchHomeUrl, fetchPrincipalUrl, serviceDiscovery } from '../../../account';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_FASTMAIL_USERNAME,
    password: process.env.CREDENTIAL_FASTMAIL_APP_PASSWORD,
  });
});

test('serviceDiscovery should be able to discover the caldav service', async () => {
  const url = await serviceDiscovery({
    account: { serverUrl: 'https://caldav.messagingengine.com/', accountType: 'caldav' },
    headers: authHeaders,
  });
  expect(url).toEqual('https://caldav.messagingengine.com/dav/calendars');
});

test('fetchPrincipalUrl should be able to fetch the url of principal collection', async () => {
  const url = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://caldav.messagingengine.com/dav/calendars',
      rootUrl: 'https://caldav.messagingengine.com/dav/calendars',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/https:\/\/caldav.messagingengine.com\/dav\/principals\/user\/.+\//);
});

test('fetchHomeUrl should be able to fetch the url of home set', async () => {
  const principalUrl = await fetchPrincipalUrl({
    account: {
      serverUrl: 'https://caldav.messagingengine.com/dav/calendars',
      rootUrl: 'https://caldav.messagingengine.com/dav/calendars',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  const url = await fetchHomeUrl({
    account: {
      principalUrl,
      serverUrl: 'https://caldav.messagingengine.com/dav/calendars',
      rootUrl: 'https://caldav.messagingengine.com/dav/calendars',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(url).toMatch(/https:\/\/caldav.messagingengine.com\/dav\/calendars\/user\/.+\//);
});

test('createAccount should be able to create account', async () => {
  const account = await createAccount({
    account: {
      serverUrl: 'https://caldav.messagingengine.com/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  expect(account.rootUrl).toEqual('https://caldav.messagingengine.com/dav/calendars');
  expect(account.principalUrl).toMatch(
    /https:\/\/caldav.messagingengine.com\/dav\/principals\/user\/.+\//,
  );
  expect(account.homeUrl).toMatch(
    /https:\/\/caldav.messagingengine.com\/dav\/calendars\/user\/.+\//,
  );
});

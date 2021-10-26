import fsp from 'fs/promises';

import { createAccount } from '../../../account';
import { fetchCalendars } from '../../../calendar';
import { isCollectionDirty } from '../../../collection';
import { createObject, deleteObject } from '../../../request';
import { DAVAccount, DAVCalendar } from '../../../types/models';
import { getOauthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;
let calendars: DAVCalendar[];

beforeAll(async () => {
  authHeaders = (
    await getOauthHeaders({
      username: process.env.CREDENTIAL_GOOGLE_USERNAME,
      refreshToken: process.env.CREDENTIAL_GOOGLE_REFRESH_TOKEN,
      clientId: process.env.CREDENTIAL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.CREDENTIAL_GOOGLE_CLIENT_SECRET,
    })
  ).headers;
  account = await createAccount({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
  calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });
});

test('isCollectionDirty should be able to tell if a collection have changed', async () => {
  const iCalString = await fsp.readFile(`${__dirname}/../data/ical/8.ics`, 'utf-8');

  const objectUrl = new URL('8.ics', calendars[0].url).href;
  const createResponse = await createObject({
    url: objectUrl,
    data: iCalString,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  expect(createResponse.ok).toBe(true);

  const { isDirty, newCtag } = await isCollectionDirty({
    collection: calendars[0],
    headers: authHeaders,
  });
  expect(isDirty).toBe(true);
  expect(newCtag.length > 0).toBe(true);
  expect(newCtag).not.toEqual(calendars[0].ctag);

  const deleteResult = await deleteObject({
    url: objectUrl,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

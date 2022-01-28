import fsp from 'fs/promises';

import { createAccount } from '../../../account';
import { fetchCalendars } from '../../../calendar';
import { isCollectionDirty, supportedReportSet } from '../../../collection';
import { createObject, deleteObject } from '../../../request';
import { DAVAccount, DAVCalendar } from '../../../types/models';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;
let calendars: DAVCalendar[];

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_FASTMAIL_USERNAME,
    password: process.env.CREDENTIAL_FASTMAIL_APP_PASSWORD,
  });
  account = await createAccount({
    account: {
      serverUrl: 'https://caldav.messagingengine.com/',
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

test('supportedReportSet should be able to list supported reports', async () => {
  const reports = await supportedReportSet({ collection: calendars[0], headers: authHeaders });
  expect(reports.length > 0).toBe(true);
});

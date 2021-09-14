import { createAccount } from './account';
import { fetchCalendars } from './calendar';
import { isCollectionDirty } from './collection';
import { createObject, deleteObject } from './request';
import { DAVAccount, DAVCalendar } from './types/models';
import { getBasicAuthHeaders } from './util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;
let calendars: DAVCalendar[];

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.ICLOUD_USERNAME,
    password: process.env.ICLOUD_APP_SPECIFIC_PASSWORD,
  });
  account = await createAccount({
    account: {
      serverUrl: 'https://caldav.icloud.com/',
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
  const iCalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210201T090800Z
DTEND:20210201T100800Z
DTSTAMP:20210201T090944Z
UID:6a3ac536-5b42-4529-ae92-5ef21c37be51
CREATED:20210201T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const objectUrl = new URL('testCollection.ics', calendars[0].url).href;
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

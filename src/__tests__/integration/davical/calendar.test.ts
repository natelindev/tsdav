import fsp from 'fs/promises';

import { createAccount } from '../../../account';
import { calendarMultiGet, fetchCalendarObjects, fetchCalendars } from '../../../calendar';
import { DAVNamespace } from '../../../consts';
import { createObject, deleteObject } from '../../../request';
import { DAVAccount } from '../../../types/models';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_DAVICAL_USERNAME,
    password: process.env.CREDENTIAL_DAVICAL_PASSWORD,
  });
  account = await createAccount({
    account: {
      serverUrl: `${process.env.CREDENTIAL_DAVICAL_SERVER_URL}`,
      accountType: 'caldav',
    },
    headers: authHeaders,
  });
});

test('fetchCalendars should be able to fetch calendars', async () => {
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });
  expect(calendars.length > 0).toBe(true);
  expect(calendars.every((c) => c.url.length > 0)).toBe(true);
});

test('calendarMultiGet should be able to get information about multiple calendar objects', async () => {
  const iCalString1 = await fsp.readFile(`${__dirname}/../data/ical/1.ics`, 'utf-8');
  const iCalString2 = await fsp.readFile(`${__dirname}/../data/ical/2.ics`, 'utf-8');
  const iCalString3 = await fsp.readFile(`${__dirname}/../data/ical/3.ics`, 'utf-8');
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL(`e5d0fab9-c366-453e-a430-88267fceade1.ics`, calendars[0].url).href;
  const objectUrl2 = new URL(`a99e4d44-f7f1-4f94-a973-875e8ecc1855.ics`, calendars[0].url).href;
  const objectUrl3 = new URL(`c89227ad-7356-43b2-ae15-ce3eac13bedf.ics`, calendars[0].url).href;

  const response1 = await createObject({
    url: objectUrl1,
    data: iCalString1,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const response2 = await createObject({
    url: objectUrl2,
    data: iCalString2,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const response3 = await createObject({
    url: objectUrl3,
    data: iCalString3,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  expect(response1.ok).toBe(true);
  expect(response2.ok).toBe(true);
  expect(response3.ok).toBe(true);

  const calendarObjects = await calendarMultiGet({
    url: calendars[0].url,
    props: [
      { name: 'getetag', namespace: DAVNamespace.DAV },
      { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
    ],
    depth: '1',
    headers: authHeaders,
  });

  expect(calendarObjects.length > 0);

  const deleteResult1 = await deleteObject({
    url: objectUrl1,
    headers: authHeaders,
  });

  const deleteResult2 = await deleteObject({
    url: objectUrl2,
    headers: authHeaders,
  });

  const deleteResult3 = await deleteObject({
    url: objectUrl3,
    headers: authHeaders,
  });

  expect(deleteResult1.ok).toBe(true);
  expect(deleteResult2.ok).toBe(true);
  expect(deleteResult3.ok).toBe(true);
});

test('fetchCalendarObjects should be able to fetch calendar objects', async () => {
  const iCalString1 = await fsp.readFile(`${__dirname}/../data/ical/4.ics`, 'utf-8');

  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('2baa32b7-a4cc-41c3-8760-73e4377c00cd.ics', calendars[0].url).href;
  await createObject({
    url: objectUrl1,
    data: iCalString1,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const objects = await fetchCalendarObjects({
    calendar: calendars[0],
    headers: authHeaders,
  });

  expect(objects.length > 0).toBe(true);
  expect(objects.every((o) => o.data?.length > 0 && o.etag?.length > 0 && o.url?.length > 0)).toBe(
    true,
  );

  await deleteObject({
    url: objectUrl1,
    headers: authHeaders,
  });
});

test('fetchCalendarObjects should be able to fetch target calendar objects when specified timeRange', async () => {
  const iCalString1 = await fsp.readFile(`${__dirname}/../data/ical/5.ics`, 'utf-8');
  const iCalString2 = await fsp.readFile(`${__dirname}/../data/ical/6.ics`, 'utf-8');
  const iCalString3 = await fsp.readFile(`${__dirname}/../data/ical/7.ics`, 'utf-8');
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('4e3ce4c2-02c7-4fbc-ace0-f2b7d579eed6.ics', calendars[0].url).href;
  const objectUrl2 = new URL('1f28015d-e140-4484-900b-0fa15e10210e.ics', calendars[0].url).href;
  const objectUrl3 = new URL('6aefd54f-c038-409a-8f9c-bf3413efd611.ics', calendars[0].url).href;

  const response1 = await createObject({
    url: objectUrl1,
    data: iCalString1,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const response2 = await createObject({
    url: objectUrl2,
    data: iCalString2,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const response3 = await createObject({
    url: objectUrl3,
    data: iCalString3,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  expect(response1.ok).toBe(true);
  expect(response2.ok).toBe(true);
  expect(response3.ok).toBe(true);

  const objects = await fetchCalendarObjects({
    calendar: calendars[0],
    headers: authHeaders,
    timeRange: {
      start: '2021-05-01T00:00:00.000Z',
      end: '2021-05-04T00:00:00.000Z',
    },
  });

  expect(objects.length).toBe(1);
  expect(objects[0].url).toEqual(objectUrl3);

  const deleteResult1 = await deleteObject({
    url: objectUrl1,
    headers: authHeaders,
  });

  const deleteResult2 = await deleteObject({
    url: objectUrl2,
    headers: authHeaders,
  });

  const deleteResult3 = await deleteObject({
    url: objectUrl3,
    headers: authHeaders,
  });

  expect(deleteResult1.ok).toBe(true);
  expect(deleteResult2.ok).toBe(true);
  expect(deleteResult3.ok).toBe(true);
});

test('fetchCalendarObjects should return empty result when no objects fall in the range', async () => {
  const iCalString1 = await fsp.readFile(`${__dirname}/../data/ical/13.ics`, 'utf-8');
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('13.ics', calendars[0].url).href;

  const response1 = await createObject({
    url: objectUrl1,
    data: iCalString1,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  expect(response1.ok).toBe(true);

  const objects = await fetchCalendarObjects({
    calendar: calendars[0],
    headers: authHeaders,
    timeRange: {
      start: '2022-03-11T10:00:00.000Z',
      end: '2022-03-11T11:00:00.000Z',
    },
    expand: true,
  });

  expect(objects.length).toBe(0);

  const deleteResult1 = await deleteObject({
    url: objectUrl1,
    headers: authHeaders,
  });

  expect(deleteResult1.ok).toBe(true);
});

test('fetchCalendarObjects should fail when passed timeRange is invalid', async () => {
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });
  const t = () =>
    fetchCalendarObjects({
      calendar: calendars[0],
      headers: authHeaders,
      timeRange: {
        start: 'Sat May 01 2021 00:00:00 GMT+0800',
        end: 'Sat May 04 2021 00:00:00 GMT+0800',
      },
    });

  expect(t()).rejects.toEqual(new Error('invalid timeRange format, not in ISO8601'));
});

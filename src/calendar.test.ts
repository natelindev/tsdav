import { createAccount } from './account';
import { calendarMultiGet, fetchCalendarObjects, fetchCalendars } from './calendar';
import { DAVNamespace } from './consts';
import { createObject, deleteObject } from './request';
import { DAVAccount } from './types/models';
import { getBasicAuthHeaders } from './util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;

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
  const iCalString1 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210401T090800Z
DTEND:20210401T100800Z
DTSTAMP:20210401T090944Z
UID:4e3ce4c2-02c7-4fbc-ace0-f2b7d579eed6
CREATED:20210401T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const iCalString2 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210402T090800Z
DTEND:20210402T100800Z
DTSTAMP:20210402T090944Z
UID:1f28015d-e140-4484-900b-0fa15e10210e
CREATED:20210402T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const iCalString3 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210502T090800Z
DTEND:20210502T100800Z
DTSTAMP:20210402T090944Z
UID:6aefd54f-c038-409a-8f9c-bf3413efd611
CREATED:20210502T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('test11.ics', calendars[0].url).href;
  const objectUrl2 = new URL('test22.ics', calendars[0].url).href;
  const objectUrl3 = new URL('http.ics', calendars[0].url).href;

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
  const iCalString1 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20200401T090800Z
DTEND:20200401T100800Z
DTSTAMP:20200401T090944Z
UID:2baa32b7-a4cc-41c3-8760-73e4377c00cd
CREATED:20200401T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('test20.ics', calendars[0].url).href;
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
    true
  );

  await deleteObject({
    url: objectUrl1,
    headers: authHeaders,
  });
});

test('fetchCalendarObjects should be able to fetch target calendar objects when specified timeRange', async () => {
  const iCalString1 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210401T090800Z
DTEND:20210401T100800Z
DTSTAMP:20210401T090944Z
UID:4e3ce4c2-02c7-4fbc-ace0-f2b7d579eed6
CREATED:20210401T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const iCalString2 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210402T090800Z
DTEND:20210402T100800Z
DTSTAMP:20210402T090944Z
UID:1f28015d-e140-4484-900b-0fa15e10210e
CREATED:20210402T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const iCalString3 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210502T090800Z
DTEND:20210502T100800Z
DTSTAMP:20210402T090944Z
UID:6aefd54f-c038-409a-8f9c-bf3413efd611
CREATED:20210502T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  const calendars = await fetchCalendars({
    account,
    headers: authHeaders,
  });

  const objectUrl1 = new URL('test11.ics', calendars[0].url).href;
  const objectUrl2 = new URL('test22.ics', calendars[0].url).href;
  const objectUrl3 = new URL('http.ics', calendars[0].url).href;

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

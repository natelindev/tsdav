import { fetch } from 'cross-fetch';

import { createAccount } from '../../../account';
import { fetchCalendarObjects, fetchCalendars } from '../../../calendar';
import { DAVNamespace } from '../../../consts';
import { createObject, davRequest, deleteObject, propfind, updateObject } from '../../../request';
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

test('davRequest should be able to send normal webdav requests', async () => {
  const [result] = await davRequest({
    url: 'https://caldav.icloud.com/',
    init: {
      method: 'PROPFIND',
      headers: authHeaders,
      namespace: 'd',
      body: {
        propfind: {
          _attributes: {
            'xmlns:d': 'DAV:',
          },
          prop: { 'd:current-user-principal': {} },
        },
      },
    },
  });
  expect(result.href?.length).toBeTruthy();
  expect(result.status).toBe(207);
  expect(result.statusText).toBe('Multi-Status');
  expect(result.ok).toBe(true);
  expect(result.props?.currentUserPrincipal.href).toMatch(/\/[0-9]+\/principal\//);
  expect(Object.prototype.hasOwnProperty.call(result, 'raw')).toBe(true);
});

test('davRequest should be able to send raw xml requests', async () => {
  const xml = `
  <d:propfind xmlns:d="DAV:">
     <d:prop>
       <d:current-user-principal/>
     </d:prop>
  </d:propfind>`;
  const [result] = await davRequest({
    url: 'https://caldav.icloud.com/',
    init: {
      method: 'PROPFIND',
      headers: authHeaders,
      body: xml,
    },
    convertIncoming: false,
  });
  expect(result.href?.length).toBeTruthy();
  expect(result.status).toBe(207);
  expect(result.statusText).toBe('Multi-Status');
  expect(result.ok).toBe(true);
  expect(result.props?.currentUserPrincipal.href).toMatch(/\/[0-9]+\/principal\//);
  expect(Object.prototype.hasOwnProperty.call(result, 'raw')).toBe(true);
});

test('davRequest should be able to get raw xml response', async () => {
  const xml = `
  <d:propfind xmlns:d="DAV:">
     <d:prop>
       <d:current-user-principal/>
     </d:prop>
  </d:propfind>`;
  const [result] = await davRequest({
    url: 'https://caldav.icloud.com/',
    init: {
      method: 'PROPFIND',
      headers: authHeaders,
      body: xml,
    },
    convertIncoming: false,
    parseOutgoing: false,
  });
  expect(result.href?.length).toBeTruthy();
  expect(result.status).toBe(207);
  expect(result.statusText).toBe('Multi-Status');
  expect(result.ok).toBe(true);
  expect(result.raw).toMatch(
    /<current-user-principal xmlns="DAV:"><href xmlns="DAV:">\/[0-9]+\/principal\/<\/href><\/current-user-principal>/
  );
});

test('propfind should be able to find props', async () => {
  const [result] = await propfind({
    url: 'https://caldav.icloud.com/',
    props: [{ name: 'current-user-principal', namespace: DAVNamespace.DAV }],
    headers: authHeaders,
  });
  expect(result.href?.length).toBeTruthy();
  expect(result.status).toBe(207);
  expect(result.statusText).toBe('Multi-Status');
  expect(result.ok).toBe(true);
  expect(result.props?.currentUserPrincipal.href).toMatch(/\/[0-9]+\/principal\//);
  expect(Object.prototype.hasOwnProperty.call(result, 'raw')).toBe(true);
});

test('createObject should be able to create object', async () => {
  const iCalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210307T090800Z
DTEND:20210307T100800Z
DTSTAMP:20210307T090944Z
UID:b53b6846-ede3-4689-b744-aa33963e1586
CREATED:20210307T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const objectUrl = new URL('test.ics', calendars[0].url).href;
  const response = await createObject({
    url: objectUrl,
    data: iCalString,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  const [calendarObject] = await fetchCalendarObjects({
    calendar: calendars[0],
    objectUrls: [objectUrl],
    headers: authHeaders,
  });

  expect(response.ok).toBe(true);
  expect(calendarObject.url.length > 0).toBe(true);
  expect(calendarObject.etag.length > 0).toBe(true);
  expect(calendarObject.data.split('\r\n').join('\n')).toEqual(iCalString);

  const deleteResult = await deleteObject({
    url: objectUrl,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

test('updateObject should be able to update object', async () => {
  const iCalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210308T090800Z
DTEND:20210308T100800Z
DTSTAMP:20210308T090944Z
UID:fbc5a3fe-e77d-4c3f-adf2-00bba5cf90b2
CREATED:20210308T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const updatedICalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210308T090800Z
DTEND:20210308T100800Z
DTSTAMP:20210308T090944Z
UID:fbc5a3fe-e77d-4c3f-adf2-00bba5cf90b2
CREATED:20210308T090944Z
SEQUENCE:0
SUMMARY:updated summary
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
`;

  const objectUrl = new URL('test2.ics', calendars[0].url).href;
  const createResult = await createObject({
    url: objectUrl,
    data: iCalString,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });
  expect(createResult.ok).toBe(true);

  const [calendarObject] = await fetchCalendarObjects({
    calendar: calendars[0],
    objectUrls: [objectUrl],
    headers: authHeaders,
  });

  const updateResult = await updateObject({
    url: objectUrl,
    data: updatedICalString,
    etag: calendarObject.etag,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });

  expect(updateResult.ok).toBe(true);

  const result = await fetch(objectUrl, {
    headers: authHeaders,
  });

  expect(result.ok).toBe(true);
  expect((await result.text()).split('\r\n').join('\n')).toEqual(updatedICalString);

  const deleteResult = await deleteObject({
    url: objectUrl,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

test('deleteObject should be able to delete object', async () => {
  const iCalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Caldav test./tsdav test 1.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:20210309T090800Z
DTEND:20210309T100800Z
DTSTAMP:20210309T090944Z
UID:0398667c-2292-4576-9751-a445f88394ab
CREATED:20210309T090944Z
SEQUENCE:0
SUMMARY:Test
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const objectUrl = new URL('test3.ics', calendars[0].url).href;
  const createResult = await createObject({
    url: objectUrl,
    data: iCalString,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...authHeaders,
    },
  });
  expect(createResult.ok).toBe(true);

  const deleteResult = await deleteObject({
    url: objectUrl,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

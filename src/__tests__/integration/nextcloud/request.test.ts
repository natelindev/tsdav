import { fetch } from 'cross-fetch';
import fsp from 'fs/promises';

import { createAccount } from '../../../account';
import { fetchCalendarObjects, fetchCalendars } from '../../../calendar';
import { DAVNamespaceShort } from '../../../consts';
import { createObject, davRequest, deleteObject, propfind, updateObject } from '../../../request';
import { DAVAccount, DAVCalendar } from '../../../types/models';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};
let account: DAVAccount;
let calendars: DAVCalendar[];

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.CREDENTIAL_NEXTCLOUD_USERNAME,
    password: process.env.CREDENTIAL_NEXTCLOUD_PASSWORD,
  });
  account = await createAccount({
    account: {
      serverUrl: `${process.env.CREDENTIAL_NEXTCLOUD_SERVER_URL}/remote.php/dav`,
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
    url: `${process.env.CREDENTIAL_NEXTCLOUD_SERVER_URL}/remote.php/dav`,
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
  expect(result.props?.currentUserPrincipal.href).toMatch(/remote.php\/dav\/principals\/users\/.+/);
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
    url: `${process.env.CREDENTIAL_NEXTCLOUD_SERVER_URL}/remote.php/dav`,
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
  expect(result.props?.currentUserPrincipal.href).toMatch(/remote.php\/dav\/principals\/users\/.+/);
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
    url: `${process.env.CREDENTIAL_NEXTCLOUD_SERVER_URL}/remote.php/dav`,
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
    /<d:current-user-principal><d:href>\/remote.php\/dav\/principals\/users\/.+\/<\/d:href><\/d:current-user-principal>/,
  );
});

test('propfind should be able to find props', async () => {
  const [result] = await propfind({
    url: `${process.env.CREDENTIAL_NEXTCLOUD_SERVER_URL}/remote.php/dav`,
    props: {
      [`${DAVNamespaceShort.DAV}:current-user-principal`]: {},
    },
    depth: '0',
    headers: authHeaders,
  });
  expect(result.href?.length).toBeTruthy();
  expect(result.status).toBe(207);
  expect(result.statusText).toBe('Multi-Status');
  expect(result.ok).toBe(true);
  expect(result.props?.currentUserPrincipal.href).toMatch(/remote.php\/dav\/principals\/users\/.+/);
  expect(Object.prototype.hasOwnProperty.call(result, 'raw')).toBe(true);
});

test('createObject should be able to create object', async () => {
  const iCalString = await fsp.readFile(`${__dirname}/../data/ical/9.ics`, 'utf-8');

  const objectUrl = new URL('9.ics', calendars[0].url).href;
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
  expect((calendarObject.etag?.length ?? 0) > 0).toBe(true);
  expect(calendarObject.data.split('\r\n').join('\n')).toEqual(iCalString);

  const deleteResult = await deleteObject({
    url: objectUrl,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

test('updateObject should be able to update object', async () => {
  const iCalString = await fsp.readFile(`${__dirname}/../data/ical/10.ics`, 'utf-8');
  const updatedICalString = await fsp.readFile(`${__dirname}/../data/ical/11.ics`, 'utf-8');

  const objectUrl = new URL('10.ics', calendars[0].url).href;
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
  const iCalString = await fsp.readFile(`${__dirname}/../data/ical/12.ics`, 'utf-8');

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

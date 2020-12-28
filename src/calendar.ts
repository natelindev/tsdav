/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';
import URL from 'url';
import fetch from 'cross-fetch';
import { DAVAccount, DAVCalendar, DAVCalendarObject } from 'models';
import { DAVDepth, DAVFilter, DAVProp, DAVResponse } from 'DAVTypes';
import { DAVNamespace, DAVNamespaceShorthandMap, ICALObjects } from './consts';
import { collectionQuery, smartCollectionSync, supportedReportSet } from './collection';
import { propfind, createObject, updateObject, deleteObject } from './request';

import { formatFilters, formatProps, getDAVAttribute, urlEquals } from './util/requestHelpers';

const debug = getLogger('tsdav:calendar');

export const calendarQuery = async (
  url: string,
  props: DAVProp[],
  options?: {
    filters?: DAVFilter[];
    timezone?: string;
    depth?: DAVDepth;
    headers?: { [key: string]: any };
  }
): Promise<DAVResponse[]> => {
  return collectionQuery(
    url,
    {
      'calendar-query': {
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.DAV,
        ]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        filter: formatFilters(options?.filters),
        timezone: options?.timezone,
      },
    },
    { depth: options?.depth, headers: options?.headers }
  );
};

export const fetchCalendars = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any } }
): Promise<DAVCalendar[]> => {
  if (!account.homeUrl || !account.rootUrl) {
    throw new Error('account must have homeUrl & rootUrl before fetchCalendars');
  }
  const res = await propfind(
    account.homeUrl,
    [
      { name: 'calendar-description', namespace: DAVNamespace.CALDAV },
      { name: 'calendar-timezone', namespace: DAVNamespace.CALDAV },
      { name: 'displayname', namespace: DAVNamespace.DAV },
      { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: DAVNamespace.DAV },
      { name: 'supported-calendar-component-set', namespace: DAVNamespace.CALDAV },
      { name: 'sync-token', namespace: DAVNamespace.DAV },
    ],
    { depth: '1', headers: options?.headers }
  );

  return Promise.all(
    res
      .filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes('calendar'))
      .filter((rc) => {
        // filter out none iCal format calendars.
        const components: ICALObjects[] = Array.isArray(
          rc.props?.supportedCalendarComponentSet.comp
        )
          ? rc.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
          : [rc.props?.supportedCalendarComponentSet.comp._attributes.name] || [];
        return components.some((c) => Object.values(ICALObjects).includes(c));
      })
      .map((rs) => {
        debug(`Found calendar ${rs.props?.displayname},
               props: ${JSON.stringify(rs.props)}`);
        return {
          data: rs,
          account,
          description: rs.props?.calendarDescription,
          timezone: rs.props?.calendarTimezone,
          url: URL.resolve(account.rootUrl ?? '', rs.href ?? ''),
          ctag: rs.props?.getctag,
          displayName: rs.props?.displayname,
          components: Array.isArray(rs.props?.supportedCalendarComponentSet.comp)
            ? rs.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
            : [rs.props?.supportedCalendarComponentSet.comp._attributes.name],
          resourcetype: Object.keys(rs.props?.resourcetype),
          syncToken: rs.props?.syncToken,
        };
      })
      .map(async (cal) => ({ ...cal, reports: await supportedReportSet(cal, options) }))
  );
};

export const fetchCalendarObjects = async (
  calendar: DAVCalendar,
  options?: { filters?: DAVFilter[]; headers?: { [key: string]: any } }
): Promise<DAVCalendarObject[]> => {
  debug(`Fetching calendar objects from ${calendar?.url}`);
  if (!calendar.account?.rootUrl) {
    throw new Error('account must have rootUrl before fetchCalendarObjects');
  }
  const filters: DAVFilter[] = options?.filters ?? [
    {
      type: 'comp-filter',
      attributes: { name: 'VCALENDAR' },
      children: [
        {
          type: 'comp-filter',
          attributes: { name: 'VEVENT' },
        },
      ],
    },
  ];
  const results = await calendarQuery(
    calendar.url,
    [
      { name: 'getetag', namespace: DAVNamespace.DAV },
      { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
    ],
    { filters, depth: '1', headers: options?.headers }
  );
  return Promise.all(
    results.map(async (res) => {
      const url = URL.resolve(calendar.account?.rootUrl ?? '', res.href ?? '');
      let response;
      if (res.props?.calendarData?._cdata) {
        response = await fetch(url, { headers: options?.headers });
      }
      return {
        url,
        etag: res.props?.getetag,
        calendarData:
          res.props?.calendarData?._cdata ?? response?.ok ? await response?.text() : undefined,
      };
    })
  );
};

export const createCalendarObject = async (
  calendar: DAVCalendar,
  iCalString: string,
  filename: string,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return createObject(URL.resolve(calendar.url, filename), iCalString, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...options?.headers,
    },
  });
};

export const updateCalendarObject = async (
  calendarObject: DAVCalendarObject,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return updateObject(calendarObject.url, calendarObject.calendarData, calendarObject.etag, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...options?.headers,
    },
  });
};

export const deleteCalendarObject = async (
  calendarObject: DAVCalendarObject,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return deleteObject(calendarObject.url, calendarObject.etag, options);
};

// remote change -> local
export const syncCalDAVAccount = async (
  account: DAVAccount,
  options?: { headers?: { [key: string]: any } }
): Promise<DAVAccount> => {
  // find changed calendar collections
  const changedCalendars = (await fetchCalendars(account, options)).filter(
    (cal) => !account.calendars?.some((a) => urlEquals(a.url, cal.url))
  );
  debug(`found changed calendars:`);
  debug(changedCalendars);
  return {
    ...account,
    accountType: 'caldav',
    calendars: [
      ...(account.calendars ?? []),
      ...(
        await Promise.all(
          changedCalendars.map(async (c) => {
            try {
              debug(`syncing ${c.displayName}`);
              return smartCollectionSync(
                {
                  ...c,
                  fetchObjects: fetchCalendarObjects,
                } as DAVCalendar,
                'webdav',
                { headers: options?.headers }
              );
            } catch (err) {
              debug(`carddav account sync: Calendar ${c.displayName} sync error: ${err}`);
              return undefined;
            }
          })
        )
      ).filter((a): a is DAVCalendar => a !== undefined),
    ],
  };
};

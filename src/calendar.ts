/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';

import { collectionQuery, smartCollectionSync, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShorthandMap, ICALObjects } from './consts';
import { createObject, davRequest, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVFilter, DAVProp, DAVResponse } from './types/DAVTypes';
import { SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVCalendar, DAVCalendarObject } from './types/models';
import { formatFilters, formatProps, getDAVAttribute, urlEquals } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelper';

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
): Promise<DAVResponse[]> =>
  collectionQuery(
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

export const calendarMultiGet = async (
  url: string,
  props: DAVProp[],
  objectUrls: string[],
  options?: {
    filters?: DAVFilter[];
    timezone?: string;
    depth: DAVDepth;
    headers?: { [key: string]: any };
  }
): Promise<DAVResponse[]> =>
  collectionQuery(
    url,
    {
      'calendar-multiget': {
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:href`]: objectUrls,
        filter: formatFilters(options?.filters),
        timezone: options?.timezone,
      },
    },
    { depth: options?.depth, headers: options?.headers }
  );

export const makeCalendar = async (
  url: string,
  props: DAVProp[],
  options?: {
    depth: DAVDepth;
    headers?: { [key: string]: any };
  }
): Promise<DAVResponse[]> =>
  davRequest(url, {
    method: 'MKCALENDAR',
    headers: { ...options?.headers, depth: options?.depth },
    namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
    body: {
      [`${DAVNamespaceShorthandMap[DAVNamespace.CALDAV]}:mkcalendar`]: {
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
        set: {
          prop: formatProps(props),
        },
      },
    },
  });

export const fetchCalendars = async (options?: {
  headers?: { [key: string]: any };
  account?: DAVAccount;
}): Promise<DAVCalendar[]> => {
  const requiredFields: Array<'homeUrl' | 'rootUrl'> = ['homeUrl', 'rootUrl'];
  if (!options?.account || !hasFields(options?.account, requiredFields)) {
    if (!options?.account) {
      throw new Error('no account for fetchCalendars');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        options.account,
        requiredFields
      )} before fetchCalendars`
    );
  }

  const { account } = options;
  const res = await propfind(
    options.account.homeUrl,
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
        // debug(`Found calendar ${rs.props?.displayname}`);
        const description = rs.props?.calendarDescription;
        const timezone = rs.props?.calendarTimezon;
        return {
          description: typeof description === 'string' ? description : '',
          timezone: typeof timezone === 'string' ? timezone : '',
          url: new URL(rs.href ?? '', account.rootUrl ?? '').href,
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
  options?: {
    objectUrls?: string[];
    filters?: DAVFilter[];
    timeRange?: { startTime: Date; endTime: Date };
    headers?: { [key: string]: any };
  }
): Promise<DAVCalendarObject[]> => {
  debug(`Fetching calendar objects from ${calendar?.url}`);
  const requiredFields: Array<'url'> = ['url'];
  if (!calendar || !hasFields(calendar, requiredFields)) {
    if (!calendar) {
      throw new Error('cannot fetchCalendarObjects for undefined calendar');
    }
    throw new Error(
      `calendar must have ${findMissingFieldNames(
        calendar,
        requiredFields
      )} before fetchCalendarObjects`
    );
  }

  // default to fetch all
  const filters: DAVFilter[] = options?.filters ?? [
    {
      type: 'comp-filter',
      attributes: { name: 'VCALENDAR' },
      children: [
        {
          type: 'comp-filter',
          attributes: { name: 'VEVENT' },
          children: options?.timeRange
            ? [
                {
                  type: 'time-range',
                  attributes: {
                    start: `${options.timeRange.startTime.toISOString().slice(0, -5)}Z`,
                    end: `${options.timeRange.endTime.toISOString().slice(0, -5)}Z`,
                  },
                },
              ]
            : undefined,
        },
      ],
    },
  ];

  const calendarObjectUrls = (
    options?.objectUrls ??
    // fetch all objects of the calendar
    (
      await calendarQuery(calendar.url, [{ name: 'getetag', namespace: DAVNamespace.DAV }], {
        filters,
        depth: '1',
        headers: options?.headers,
      })
    ).map((res) => res.href ?? '')
  )
    .map((url) => (url.includes('http') ? url : new URL(url, calendar.url).href))
    .map((url) => new URL(url).pathname)
    .filter((url): url is string => Boolean(url?.includes('.ics')));

  const calendarObjectResults = await calendarMultiGet(
    calendar.url,
    [
      { name: 'getetag', namespace: DAVNamespace.DAV },
      { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
    ],
    calendarObjectUrls,
    { depth: '1', headers: options?.headers }
  );

  return calendarObjectResults.map((res) => ({
    url: new URL(res.href ?? '', calendar.url).href,
    etag: res.props?.getetag,
    data: res.props?.calendarData?._cdata ?? res.props?.calendarData,
  }));
};

export const createCalendarObject = async (
  calendar: DAVCalendar,
  iCalString: string,
  filename: string,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return createObject(new URL(filename, calendar.url).href, iCalString, {
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
  return updateObject(calendarObject.url, calendarObject.data, calendarObject.etag, {
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

/**
 * Sync remote calendars to local
 */
export const syncCalendars: SyncCalendars = async (
  oldCalendars: DAVCalendar[],
  options?: {
    headers?: { [key: string]: any };
    account?: DAVAccount;
    detailedResult?: boolean;
  }
): Promise<any> => {
  if (!options?.account) {
    throw new Error('Must have account before syncCalendars');
  }
  const { account } = options;
  const localCalendars = oldCalendars ?? account.calendars ?? [];
  const remoteCalendars = await fetchCalendars({ ...options, account });

  // no existing url
  const created = remoteCalendars.filter((rc) =>
    localCalendars.every((lc) => !urlEquals(lc.url, rc.url))
  );
  debug(`new calendars: ${created.map((cc) => cc.displayName)}`);

  // have same url, but syncToken/ctag different
  const updated = localCalendars.reduce((prev, curr) => {
    const found = remoteCalendars.find((rc) => urlEquals(rc.url, curr.url));
    if (
      found &&
      ((found.syncToken && found.syncToken !== curr.syncToken) ||
        (found.ctag && found.ctag !== curr.ctag))
    ) {
      return [...prev, found];
    }
    return prev;
  }, []);
  debug(`updated calendars: ${updated.map((cc) => cc.displayName)}`);

  const updatedWithObjects: DAVCalendar[] = await Promise.all(
    updated.map(async (u) => {
      const result = (await smartCollectionSync(
        { ...u, objectMultiGet: calendarMultiGet },
        'webdav',
        {
          headers: options.headers,
          account,
        }
      )) as DAVCalendar;
      return result;
    })
  );
  // does not present in remote
  const deleted = localCalendars.filter((cal) =>
    remoteCalendars.every((rc) => !urlEquals(rc.url, cal.url))
  );
  debug(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);

  const unchanged = localCalendars.filter((cal) =>
    remoteCalendars.some(
      (rc) =>
        urlEquals(rc.url, cal.url) &&
        ((rc.syncToken && rc.syncToken !== cal.syncToken) || (rc.ctag && rc.ctag !== cal.ctag))
    )
  );
  // debug(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);

  return options?.detailedResult
    ? {
        created,
        updated,
        deleted,
      }
    : [...unchanged, ...created, ...updatedWithObjects];
};

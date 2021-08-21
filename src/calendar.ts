/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';

import { collectionQuery, smartCollectionSync, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShorthandMap, ICALObjects } from './consts';
import { createObject, davRequest, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVFilter, DAVProp, DAVResponse } from './types/DAVTypes';
import { SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVCalendar, DAVCalendarObject } from './types/models';
import {
  cleanupFalsy,
  formatFilters,
  formatProps,
  getDAVAttribute,
  urlContains,
} from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelpers';

const debug = getLogger('tsdav:calendar');

export const calendarQuery = async (params: {
  url: string;
  props: DAVProp[];
  filters?: DAVFilter[];
  timezone?: string;
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, filters, timezone, depth, headers } = params;
  return collectionQuery({
    url,
    body: {
      'calendar-query': {
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.DAV,
        ]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        filter: formatFilters(filters),
        timezone,
      },
    },
    defaultNamespace: DAVNamespace.CALDAV,
    depth,
    headers,
  });
};

export const calendarMultiGet = async (params: {
  url: string;
  props: DAVProp[];
  objectUrls?: string[];
  filters?: DAVFilter[];
  timezone?: string;
  depth: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, objectUrls, filters, timezone, depth, headers } = params;
  return collectionQuery({
    url,
    body: {
      'calendar-multiget': {
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:href`]: objectUrls,
        filter: formatFilters(filters),
        timezone,
      },
    },
    defaultNamespace: DAVNamespace.CALDAV,
    depth,
    headers,
  });
};

export const makeCalendar = async (params: {
  url: string;
  props: DAVProp[];
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, depth, headers } = params;
  return davRequest({
    url,
    init: {
      method: 'MKCALENDAR',
      headers: cleanupFalsy({ ...headers, depth }),
      namespace: DAVNamespaceShorthandMap[DAVNamespace.DAV],
      body: {
        [`${DAVNamespaceShorthandMap[DAVNamespace.CALDAV]}:mkcalendar`]: {
          _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
          set: {
            prop: formatProps(props),
          },
        },
      },
    },
  });
};

export const fetchCalendars = async (params?: {
  account?: DAVAccount;
  headers?: Record<string, string>;
}): Promise<DAVCalendar[]> => {
  const { headers, account } = params ?? {};
  const requiredFields: Array<'homeUrl' | 'rootUrl'> = ['homeUrl', 'rootUrl'];
  if (!account || !hasFields(account, requiredFields)) {
    if (!account) {
      throw new Error('no account for fetchCalendars');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(account, requiredFields)} before fetchCalendars`
    );
  }

  const res = await propfind({
    url: account.homeUrl,
    props: [
      { name: 'calendar-description', namespace: DAVNamespace.CALDAV },
      { name: 'calendar-timezone', namespace: DAVNamespace.CALDAV },
      { name: 'displayname', namespace: DAVNamespace.DAV },
      { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: DAVNamespace.DAV },
      { name: 'supported-calendar-component-set', namespace: DAVNamespace.CALDAV },
      { name: 'sync-token', namespace: DAVNamespace.DAV },
    ],
    depth: '1',
    headers,
  });

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
      .map(async (cal) => ({
        ...cal,
        reports: await supportedReportSet({ collection: cal, headers }),
      }))
  );
};

export const fetchCalendarObjects = async (params: {
  calendar: DAVCalendar;
  objectUrls?: string[];
  filters?: DAVFilter[];
  timeRange?: { start: string; end: string };
  headers?: Record<string, string>;
}): Promise<DAVCalendarObject[]> => {
  const { calendar, objectUrls, filters: defaultFilters, timeRange, headers } = params;

  if (timeRange) {
    // validate timeRange
    const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;
    const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
    if (
      (!ISO_8601.test(timeRange.start) || !ISO_8601.test(timeRange.end)) &&
      (!ISO_8601_FULL.test(timeRange.start) || !ISO_8601_FULL.test(timeRange.end))
    ) {
      throw new Error('invalid timeRange format, not in ISO8601');
    }
  }
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
  const filters: DAVFilter[] = defaultFilters ?? [
    {
      type: 'comp-filter',
      attributes: { name: 'VCALENDAR' },
      children: [
        {
          type: 'comp-filter',
          attributes: { name: 'VEVENT' },
          children: timeRange
            ? [
                {
                  type: 'time-range',
                  attributes: {
                    start: new Date(timeRange.start).toISOString().replace(/[-:.]/g, ''),
                    end: new Date(timeRange.end).toISOString().replace(/[-:.]/g, ''),
                  },
                },
              ]
            : undefined,
        },
      ],
    },
  ];

  const calendarObjectUrls = (
    objectUrls ??
    // fetch all objects of the calendar
    (
      await calendarQuery({
        url: calendar.url,
        props: [{ name: 'getetag', namespace: DAVNamespace.DAV }],
        filters,
        depth: '1',
        headers,
      })
    ).map((res) => res.href ?? '')
  )
    .map((url) => (url.startsWith('http') ? url : new URL(url, calendar.url).href)) // patch up to full url if url is not full
    .map((url) => new URL(url).pathname) // obtain pathname of the url
    .filter((url): url is string => Boolean(url?.includes('.ics'))); // filter out non ics calendar objects since apple calendar might have those

  const calendarObjectResults = await calendarMultiGet({
    url: calendar.url,
    props: [
      { name: 'getetag', namespace: DAVNamespace.DAV },
      { name: 'calendar-data', namespace: DAVNamespace.CALDAV },
    ],
    objectUrls: calendarObjectUrls,
    depth: '1',
    headers,
  });

  return calendarObjectResults.map((res) => ({
    url: new URL(res.href ?? '', calendar.url).href,
    etag: res.props?.getetag,
    data: res.props?.calendarData?._cdata ?? res.props?.calendarData,
  }));
};

export const createCalendarObject = async (params: {
  calendar: DAVCalendar;
  iCalString: string;
  filename: string;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { calendar, iCalString, filename, headers } = params;
  return createObject({
    url: new URL(filename, calendar.url).href,
    data: iCalString,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...headers,
    },
  });
};

export const updateCalendarObject = async (params: {
  calendarObject: DAVCalendarObject;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { calendarObject, headers } = params;
  return updateObject({
    url: calendarObject.url,
    data: calendarObject.data,
    etag: calendarObject.etag,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      ...headers,
    },
  });
};

export const deleteCalendarObject = async (params: {
  calendarObject: DAVCalendarObject;
  headers?: Record<string, string>;
}): Promise<Response> => {
  const { calendarObject, headers } = params;
  return deleteObject({ url: calendarObject.url, etag: calendarObject.etag, headers });
};

/**
 * Sync remote calendars to local
 */
export const syncCalendars: SyncCalendars = async (params: {
  oldCalendars: DAVCalendar[];
  headers?: Record<string, string>;
  account?: DAVAccount;
  detailedResult?: boolean;
}): Promise<any> => {
  const { oldCalendars, account, detailedResult, headers } = params;
  if (!account) {
    throw new Error('Must have account before syncCalendars');
  }

  const localCalendars = oldCalendars ?? account.calendars ?? [];
  const remoteCalendars = await fetchCalendars({ account, headers });

  // no existing url
  const created = remoteCalendars.filter((rc) =>
    localCalendars.every((lc) => !urlContains(lc.url, rc.url))
  );
  debug(`new calendars: ${created.map((cc) => cc.displayName)}`);

  // have same url, but syncToken/ctag different
  const updated = localCalendars.reduce<DAVCalendar[]>((prev, curr) => {
    const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
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
      const result = await smartCollectionSync({
        collection: { ...u, objectMultiGet: calendarMultiGet },
        method: 'webdav',
        headers,
        account,
      });
      return result;
    })
  );
  // does not present in remote
  const deleted = localCalendars.filter((cal) =>
    remoteCalendars.every((rc) => !urlContains(rc.url, cal.url))
  );
  debug(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);

  const unchanged = localCalendars.filter((cal) =>
    remoteCalendars.some(
      (rc) =>
        urlContains(rc.url, cal.url) &&
        ((rc.syncToken && rc.syncToken !== cal.syncToken) || (rc.ctag && rc.ctag !== cal.ctag))
    )
  );
  // debug(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);

  return detailedResult
    ? {
        created,
        updated,
        deleted,
      }
    : [...unchanged, ...created, ...updatedWithObjects];
};

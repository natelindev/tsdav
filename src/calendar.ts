/* eslint-disable no-underscore-dangle */
import getLogger from 'debug';
import { ElementCompact } from 'xml-js';

import { collectionQuery, smartCollectionSync, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShort, ICALObjects } from './consts';
import { createObject, davRequest, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVCalendar, DAVCalendarObject } from './types/models';
import { cleanupFalsy, getDAVAttribute, urlContains } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelpers';

const debug = getLogger('tsdav:calendar');

export const calendarQuery = async (params: {
  url: string;
  props: ElementCompact;
  filters?: ElementCompact;
  timezone?: string;
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, filters, timezone, depth, headers } = params;
  return collectionQuery({
    url,
    body: {
      'calendar-query': cleanupFalsy({
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.DAV,
        ]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        filter: filters,
        timezone,
      }),
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers,
  });
};

export const calendarMultiGet = async (params: {
  url: string;
  props: ElementCompact;
  objectUrls?: string[];
  filters?: ElementCompact;
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
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        [`${DAVNamespaceShort.DAV}:href`]: objectUrls,
        filter: filters,
        timezone,
      },
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers,
  });
};

export const makeCalendar = async (params: {
  url: string;
  props: ElementCompact;
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse[]> => {
  const { url, props, depth, headers } = params;
  return davRequest({
    url,
    init: {
      method: 'MKCALENDAR',
      headers: cleanupFalsy({ depth, ...headers }),
      namespace: DAVNamespaceShort.DAV,
      body: {
        [`${DAVNamespaceShort.CALDAV}:mkcalendar`]: {
          _attributes: getDAVAttribute([
            DAVNamespace.DAV,
            DAVNamespace.CALDAV,
            DAVNamespace.CALDAV_APPLE,
          ]),
          set: {
            prop: props,
          },
        },
      },
    },
  });
};

export const fetchCalendars = async (params?: {
  account?: DAVAccount;
  props?: ElementCompact;
  headers?: Record<string, string>;
}): Promise<DAVCalendar[]> => {
  const { headers, account, props: customProps } = params ?? {};
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
    props: customProps ?? {
      [`${DAVNamespaceShort.CALDAV}:calendar-description`]: {},
      [`${DAVNamespaceShort.CALDAV}:calendar-timezone`]: {},
      [`${DAVNamespaceShort.DAV}:displayname`]: {},
      [`${DAVNamespaceShort.CALDAV_APPLE}:calendar-color`]: {},
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
      [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
      [`${DAVNamespaceShort.CALDAV}:supported-calendar-component-set`]: {},
      [`${DAVNamespaceShort.DAV}:sync-token`]: {},
    },
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
        const timezone = rs.props?.calendarTimezone;
        return {
          description: typeof description === 'string' ? description : '',
          timezone: typeof timezone === 'string' ? timezone : '',
          url: new URL(rs.href ?? '', account.rootUrl ?? '').href,
          ctag: rs.props?.getctag,
          calendarColor: rs.props?.calendarColor,
          displayName: rs.props?.displayname._cdata ?? rs.props?.displayname,
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
  filters?: ElementCompact;
  timeRange?: { start: string; end: string };
  expand?: boolean;
  urlFilter?: (url: string) => boolean;
  headers?: Record<string, string>;
}): Promise<DAVCalendarObject[]> => {
  const {
    calendar,
    objectUrls,
    filters: customFilters,
    timeRange,
    headers,
    expand,
    urlFilter,
  } = params;

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
  const filters: ElementCompact = customFilters ?? [
    {
      'comp-filter': {
        _attributes: {
          name: 'VCALENDAR',
        },
        'comp-filter': {
          _attributes: {
            name: 'VEVENT',
          },
          ...(timeRange
            ? {
                'time-range': {
                  _attributes: {
                    start: `${new Date(timeRange.start)
                      .toISOString()
                      .slice(0, 19)
                      .replace(/[-:.]/g, '')}Z`,
                    end: `${new Date(timeRange.end)
                      .toISOString()
                      .slice(0, 19)
                      .replace(/[-:.]/g, '')}Z`,
                  },
                },
              }
            : {}),
        },
      },
    },
  ];

  const calendarObjectUrls = (
    objectUrls ??
    // fetch all objects of the calendar
    (
      await calendarQuery({
        url: calendar.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
        },
        filters,
        depth: '1',
        headers,
      })
    ).map((res) => res.href ?? '')
  )
    .map((url) => (url.startsWith('http') || !url ? url : new URL(url, calendar.url).href)) // patch up to full url if url is not full
    .filter(urlFilter ?? ((url: string) => Boolean(url?.includes('.ics')))) // filter out non ics calendar objects since apple calendar might have those
    .map((url) => new URL(url).pathname); // obtain pathname of the url

  const calendarObjectResults =
    calendarObjectUrls.length > 0
      ? await calendarMultiGet({
          url: calendar.url,
          props: {
            [`${DAVNamespaceShort.DAV}:getetag`]: {},
            [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {
              ...(expand && timeRange
                ? {
                    [`${DAVNamespaceShort.CALDAV}:expand`]: {
                      _attributes: {
                        start: `${new Date(timeRange.start)
                          .toISOString()
                          .slice(0, 19)
                          .replace(/[-:.]/g, '')}Z`,
                        end: `${new Date(timeRange.end)
                          .toISOString()
                          .slice(0, 19)
                          .replace(/[-:.]/g, '')}Z`,
                      },
                    },
                  }
                : {}),
            },
          },
          objectUrls: calendarObjectUrls,
          depth: '1',
          headers,
        })
      : [];

  return calendarObjectResults.map((res) => ({
    url: new URL(res.href ?? '', calendar.url).href,
    etag: `${res.props?.getetag}`,
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
      'If-None-Match': '*',
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

export const freeBusyQuery = async (params: {
  url: string;
  timeRange: { start: string; end: string };
  depth?: DAVDepth;
  headers?: Record<string, string>;
}): Promise<DAVResponse> => {
  const { url, timeRange, depth, headers } = params;

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
  } else {
    throw new Error('timeRange is required');
  }

  const result = await collectionQuery({
    url,
    body: {
      'free-busy-query': cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.CALDAV]),
        [`${DAVNamespaceShort.CALDAV}:time-range`]: {
          _attributes: {
            start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, '')}Z`,
            end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, '')}Z`,
          },
        },
      }),
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers,
  });
  return result[0];
};

import { ElementCompact } from 'xml-js';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVCalendar, DAVCalendarObject } from './types/models';
export declare const fetchCalendarUserAddresses: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<string[]>;
export declare const calendarQuery: (params: {
    url: string;
    props: ElementCompact;
    filters?: ElementCompact;
    timezone?: string;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const calendarMultiGet: (params: {
    url: string;
    props: ElementCompact;
    objectUrls?: string[];
    timezone?: string;
    depth: DAVDepth;
    filters?: ElementCompact;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const makeCalendar: (params: {
    url: string;
    props: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const fetchCalendars: (params?: {
    account?: DAVAccount;
    props?: ElementCompact;
    projectedProps?: Record<string, boolean>;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVCalendar[]>;
export declare const fetchCalendarObjects: (params: {
    calendar: DAVCalendar;
    objectUrls?: string[];
    filters?: ElementCompact;
    timeRange?: {
        start: string;
        end: string;
    };
    expand?: boolean;
    urlFilter?: (url: string) => boolean;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    useMultiGet?: boolean;
    fetchOptions?: RequestInit;
}) => Promise<DAVCalendarObject[]>;
export declare const createCalendarObject: (params: {
    calendar: DAVCalendar;
    iCalString: string;
    filename: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const updateCalendarObject: (params: {
    calendarObject: DAVCalendarObject;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const deleteCalendarObject: (params: {
    calendarObject: DAVCalendarObject;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
/**
 * Sync remote calendars to local
 */
export declare const syncCalendars: SyncCalendars;
export declare const freeBusyQuery: (params: {
    url: string;
    timeRange: {
        start: string;
        end: string;
    };
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse>;

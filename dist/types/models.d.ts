import { ElementCompact } from 'xml-js';
import { DAVDepth, DAVResponse } from './DAVTypes';
export type DAVCollection = {
    objects?: DAVObject[];
    ctag?: string;
    description?: string;
    displayName?: string | Record<string, unknown>;
    reports?: any;
    resourcetype?: any;
    syncToken?: string;
    url: string;
    fetchOptions?: RequestInit;
    fetchObjects?: ((params?: {
        collection: DAVCalendar;
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
    }) => Promise<DAVCalendarObject[]>) | ((params?: {
        collection: DAVAddressBook;
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
    }) => Promise<DAVVCard[]>);
    objectMultiGet?: (params: {
        url: string;
        props: ElementCompact;
        objectUrls: string[];
        filters?: ElementCompact;
        timezone?: string;
        depth: DAVDepth;
        fetchOptions?: RequestInit;
        headers?: Record<string, string>;
    }) => Promise<DAVResponse[]>;
};
export type DAVObject = {
    data?: any;
    etag?: string;
    url: string;
};
export type DAVCredentials = {
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    authorizationCode?: string;
    redirectUrl?: string;
    tokenUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    expiration?: number;
    digestString?: string;
    customData?: Record<string, unknown>;
};
export type DAVAccount = {
    accountType: 'caldav' | 'carddav';
    serverUrl: string;
    credentials?: DAVCredentials;
    rootUrl?: string;
    principalUrl?: string;
    homeUrl?: string;
    calendars?: DAVCalendar[];
    addressBooks?: DAVAddressBook[];
};
export type DAVVCard = DAVObject;
export type DAVCalendarObject = DAVObject;
export type DAVAddressBook = DAVCollection;
export type DAVCalendar = {
    components?: string[];
    timezone?: string;
    projectedProps?: Record<string, unknown>;
    calendarColor?: string;
} & DAVCollection;

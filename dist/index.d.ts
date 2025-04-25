import * as client from './client';
import { DAVNamespace, DAVNamespaceShort } from './consts';
export type { DAVDepth, DAVMethods, DAVRequest, DAVResponse, DAVTokens } from './types/DAVTypes';
export type { DAVAccount, DAVAddressBook, DAVCalendar, DAVCalendarObject, DAVCollection, DAVCredentials, DAVObject, DAVVCard, } from './types/models';
export { DAVClient } from './client';
export { createDAVClient } from './client';
export { createAccount } from './account';
export { davRequest, propfind, createObject, updateObject, deleteObject } from './request';
export { collectionQuery, supportedReportSet, isCollectionDirty, syncCollection, smartCollectionSync, } from './collection';
export { calendarQuery, calendarMultiGet, makeCalendar, fetchCalendars, fetchCalendarUserAddresses, fetchCalendarObjects, createCalendarObject, updateCalendarObject, deleteCalendarObject, syncCalendars, freeBusyQuery, } from './calendar';
export { addressBookQuery, addressBookMultiGet, fetchAddressBooks, fetchVCards, createVCard, updateVCard, deleteVCard, } from './addressBook';
export { getBasicAuthHeaders, getOauthHeaders, fetchOauthTokens, refreshAccessToken, } from './util/authHelpers';
export { urlContains, urlEquals, getDAVAttribute, cleanupFalsy } from './util/requestHelpers';
export { DAVNamespace, DAVAttributeMap, DAVNamespaceShort } from './consts';
declare const _default: {
    urlEquals: (urlA?: string, urlB?: string) => boolean;
    urlContains: (urlA?: string, urlB?: string) => boolean;
    getDAVAttribute: (nsArr: DAVNamespace[]) => {
        [key: string]: DAVNamespace;
    };
    cleanupFalsy: <T extends object = object>(obj: T) => import("./util/typeHelpers").NoUndefinedField<T>;
    conditionalParam: <T>(key: string, param: T) => {
        [key: string]: T;
    };
    excludeHeaders: (headers: Record<string, string> | undefined, headersToExclude: string[] | undefined) => Record<string, string>;
    defaultParam: <F extends (...args: any[]) => any>(fn: F, params: Partial<Parameters<F>[0]>) => (...args: Parameters<F>) => ReturnType<F>;
    getBasicAuthHeaders: (credentials: import("./types/models").DAVCredentials) => {
        authorization?: string;
    };
    fetchOauthTokens: (credentials: import("./types/models").DAVCredentials, fetchOptions?: RequestInit) => Promise<import("./types/DAVTypes").DAVTokens>;
    refreshAccessToken: (credentials: import("./types/models").DAVCredentials, fetchOptions?: RequestInit) => Promise<{
        access_token?: string;
        expires_in?: number;
    }>;
    getOauthHeaders: (credentials: import("./types/models").DAVCredentials, fetchOptions?: RequestInit) => Promise<{
        tokens: import("./types/DAVTypes").DAVTokens;
        headers: {
            authorization?: string;
        };
    }>;
    fetchCalendarUserAddresses: (params: {
        account: import("./types/models").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    calendarQuery: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        filters?: import("xml-js/types").ElementCompact;
        timezone?: string;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    calendarMultiGet: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        objectUrls?: string[];
        timezone?: string;
        depth: import("./types/DAVTypes").DAVDepth;
        filters?: import("xml-js/types").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    makeCalendar: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    fetchCalendars: (params?: {
        account?: import("./types/models").DAVAccount;
        props?: import("xml-js/types").ElementCompact;
        projectedProps?: Record<string, boolean>;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/models").DAVCalendar[]>;
    fetchCalendarObjects: (params: {
        calendar: import("./types/models").DAVCalendar;
        objectUrls?: string[];
        filters?: import("xml-js/types").ElementCompact;
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
    }) => Promise<import("./types/models").DAVCalendarObject[]>;
    createCalendarObject: (params: {
        calendar: import("./types/models").DAVCalendar;
        iCalString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateCalendarObject: (params: {
        calendarObject: import("./types/models").DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteCalendarObject: (params: {
        calendarObject: import("./types/models").DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    syncCalendars: import("./types/functionsOverloads").SyncCalendars;
    freeBusyQuery: (params: {
        url: string;
        timeRange: {
            start: string;
            end: string;
        };
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse>;
    addressBookQuery: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        filters?: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    addressBookMultiGet: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        objectUrls: string[];
        depth: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    fetchAddressBooks: (params?: {
        account?: import("./types/models").DAVAccount;
        props?: import("xml-js/types").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/models").DAVAddressBook[]>;
    fetchVCards: (params: {
        addressBook: import("./types/models").DAVAddressBook;
        headers?: Record<string, string>;
        objectUrls?: string[];
        urlFilter?: (url: string) => boolean;
        useMultiGet?: boolean;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/models").DAVVCard[]>;
    createVCard: (params: {
        addressBook: import("./types/models").DAVAddressBook;
        vCardString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateVCard: (params: {
        vCard: import("./types/models").DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteVCard: (params: {
        vCard: import("./types/models").DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    serviceDiscovery: (params: {
        account: import("./types/models").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    fetchPrincipalUrl: (params: {
        account: import("./types/models").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    fetchHomeUrl: (params: {
        account: import("./types/models").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    createAccount: (params: {
        account: import("./types/models").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        loadCollections?: boolean;
        loadObjects?: boolean;
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/models").DAVAccount>;
    collectionQuery: (params: {
        url: string;
        body: any;
        depth?: import("./types/DAVTypes").DAVDepth;
        defaultNamespace?: DAVNamespaceShort;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    makeCollection: (params: {
        url: string;
        props?: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    supportedReportSet: (params: {
        collection: import("./types/models").DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    isCollectionDirty: (params: {
        collection: import("./types/models").DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<{
        isDirty: boolean;
        newCtag: string;
    }>;
    syncCollection: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        syncLevel?: number;
        syncToken?: string;
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    smartCollectionSync: import("./types/functionsOverloads").SmartCollectionSync;
    davRequest: (params: {
        url: string;
        init: import("./types/DAVTypes").DAVRequest;
        convertIncoming?: boolean;
        parseOutgoing?: boolean;
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    propfind: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
    createObject: (params: {
        url: string;
        data: BodyInit;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateObject: (params: {
        url: string;
        data: BodyInit;
        etag?: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteObject: (params: {
        url: string;
        etag?: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    createDAVClient: (params: {
        serverUrl: string;
        credentials: import("./types/models").DAVCredentials;
        authMethod?: "Basic" | "Oauth" | "Digest" | "Custom";
        authFunction?: (credentials: import("./types/models").DAVCredentials) => Promise<Record<string, string>>;
        defaultAccountType?: import("./types/models").DAVAccount["accountType"] | undefined;
    }) => Promise<{
        davRequest: (params0: {
            url: string;
            init: import("./types/DAVTypes").DAVRequest;
            convertIncoming?: boolean;
            parseOutgoing?: boolean;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        propfind: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            depth?: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        createAccount: (params0: {
            account: import("./util/typeHelpers").Optional<import("./types/models").DAVAccount, "serverUrl">;
            headers?: Record<string, string>;
            loadCollections?: boolean;
            loadObjects?: boolean;
        }) => Promise<import("./types/models").DAVAccount>;
        createObject: (params: {
            url: string;
            data: BodyInit;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        updateObject: (params: {
            url: string;
            data: BodyInit;
            etag?: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        deleteObject: (params: {
            url: string;
            etag?: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        calendarQuery: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            filters?: import("xml-js/types").ElementCompact;
            timezone?: string;
            depth?: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        addressBookQuery: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            filters?: import("xml-js/types").ElementCompact;
            depth?: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        collectionQuery: (params: {
            url: string;
            body: any;
            depth?: import("./types/DAVTypes").DAVDepth;
            defaultNamespace?: DAVNamespaceShort;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        makeCollection: (params: {
            url: string;
            props?: import("xml-js/types").ElementCompact;
            depth?: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        calendarMultiGet: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            objectUrls?: string[];
            timezone?: string;
            depth: import("./types/DAVTypes").DAVDepth;
            filters?: import("xml-js/types").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        makeCalendar: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            depth?: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        syncCollection: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            syncLevel?: number;
            syncToken?: string;
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        supportedReportSet: (params: {
            collection: import("./types/models").DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<string[]>;
        isCollectionDirty: (params: {
            collection: import("./types/models").DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<{
            isDirty: boolean;
            newCtag: string;
        }>;
        smartCollectionSync: import("./types/functionsOverloads").SmartCollectionSync;
        fetchCalendars: (params?: {
            account?: import("./types/models").DAVAccount;
            props?: import("xml-js/types").ElementCompact;
            projectedProps?: Record<string, boolean>;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        } | undefined) => Promise<import("./types/models").DAVCalendar[]>;
        fetchCalendarUserAddresses: (params: {
            account: import("./types/models").DAVAccount;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<string[]>;
        fetchCalendarObjects: (params: {
            calendar: import("./types/models").DAVCalendar;
            objectUrls?: string[];
            filters?: import("xml-js/types").ElementCompact;
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
        }) => Promise<import("./types/models").DAVObject[]>;
        createCalendarObject: (params: {
            calendar: import("./types/models").DAVCalendar;
            iCalString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        updateCalendarObject: (params: {
            calendarObject: import("./types/models").DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        deleteCalendarObject: (params: {
            calendarObject: import("./types/models").DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        syncCalendars: import("./types/functionsOverloads").SyncCalendars;
        fetchAddressBooks: (params?: {
            account?: import("./types/models").DAVAccount;
            props?: import("xml-js/types").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        } | undefined) => Promise<import("./types/models").DAVCollection[]>;
        addressBookMultiGet: (params: {
            url: string;
            props: import("xml-js/types").ElementCompact;
            objectUrls: string[];
            depth: import("./types/DAVTypes").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/DAVTypes").DAVResponse[]>;
        fetchVCards: (params: {
            addressBook: import("./types/models").DAVAddressBook;
            headers?: Record<string, string>;
            objectUrls?: string[];
            urlFilter?: (url: string) => boolean;
            useMultiGet?: boolean;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<import("./types/models").DAVObject[]>;
        createVCard: (params: {
            addressBook: import("./types/models").DAVAddressBook;
            vCardString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        updateVCard: (params: {
            vCard: import("./types/models").DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        deleteVCard: (params: {
            vCard: import("./types/models").DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
    }>;
    DAVClient: typeof client.DAVClient;
    DAVNamespace: typeof DAVNamespace;
    DAVNamespaceShort: typeof DAVNamespaceShort;
    DAVAttributeMap: {
        "urn:ietf:params:xml:ns:caldav": string;
        "urn:ietf:params:xml:ns:carddav": string;
        "http://calendarserver.org/ns/": string;
        "http://apple.com/ns/ical/": string;
        "DAV:": string;
    };
};
export default _default;

import * as client from './client';
import { DAVNamespace, DAVNamespaceShort } from './consts';
export type { DAVDepth, DAVMethods, DAVRequest, DAVResponse, DAVTokens } from './types/DAVTypes';
export type { DAVAccount, DAVAddressBook, DAVCalendar, DAVCalendarObject, DAVCollection, DAVCredentials, DAVObject, DAVVCard, } from './types/models';
export { DAVClient } from './client';
export { createDAVClient } from './client';
export { createAccount } from './account';
export { davRequest, propfind, createObject, updateObject, deleteObject } from './request';
export { collectionQuery, supportedReportSet, isCollectionDirty, syncCollection, smartCollectionSync, smartCollectionSyncDetailed, } from './collection';
export { calendarQuery, calendarMultiGet, makeCalendar, fetchCalendars, fetchCalendarUserAddresses, fetchCalendarObjects, createCalendarObject, updateCalendarObject, deleteCalendarObject, syncCalendars, syncCalendarsDetailed, freeBusyQuery, } from './calendar';
export { addressBookQuery, addressBookMultiGet, fetchAddressBooks, fetchVCards, createVCard, updateVCard, deleteVCard, } from './addressBook';
export { getBasicAuthHeaders, getBearerAuthHeaders, getOauthHeaders, fetchOauthTokens, refreshAccessToken, } from './util/authHelpers';
export { urlContains, urlEquals, getDAVAttribute, cleanupFalsy } from './util/requestHelpers';
export { DAVNamespace, DAVAttributeMap, DAVNamespaceShort } from './consts';
declare const _default: {
    urlEquals: (urlA?: string, urlB?: string) => boolean;
    urlContains: (urlA?: string, urlB?: string) => boolean;
    urlMatches: (urlA?: string, urlB?: string, baseUrl?: string) => boolean;
    getDAVAttribute: (nsArr: DAVNamespace[]) => {
        [key: string]: DAVNamespace;
    };
    cleanupFalsy: <T extends object = object>(obj: T) => import("./util/typeHelpers").NoUndefinedField<T>;
    conditionalParam: <T>(key: string, param: T) => {
        [key: string]: T;
    };
    excludeHeaders: (headers: Record<string, string> | undefined, headersToExclude: string[] | undefined) => Record<string, string>;
    mergeHeaders: (...headerSources: Array<HeadersInit | undefined>) => Record<string, string>;
    davRequest: (params: {
        url: string;
        init: import(".").DAVRequest;
        convertIncoming?: boolean;
        parseOutgoing?: boolean;
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<import(".").DAVResponse[]>;
    propfind: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<import(".").DAVResponse[]>;
    createObject: (params: {
        url: string;
        data: BodyInit;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<Response>;
    updateObject: (params: {
        url: string;
        data: BodyInit;
        etag?: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<Response>;
    deleteObject: (params: {
        url: string;
        etag?: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<Response>;
    collectionQuery: (params: {
        url: string;
        body: any;
        depth?: import(".").DAVDepth;
        defaultNamespace?: DAVNamespaceShort;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    makeCollection: (params: {
        url: string;
        props?: import("xml-js").ElementCompact;
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    supportedReportSet: (params: {
        collection: import(".").DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<string[]>;
    isCollectionDirty: (params: {
        collection: import(".").DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<{
        isDirty: boolean;
        newCtag: string;
    }>;
    syncCollection: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        syncLevel?: number;
        syncToken?: string;
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    smartCollectionSync: import("./types/functionsOverloads").SmartCollectionSync;
    smartCollectionSyncDetailed: import("./types/functionsOverloads").SmartCollectionSyncDetailed;
    addressBookQuery: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        filters?: import("xml-js").ElementCompact;
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    addressBookMultiGet: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        objectUrls: string[];
        depth: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    fetchAddressBooks: (params?: {
        account?: import(".").DAVAccount;
        props?: import("xml-js").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVAddressBook[]>;
    fetchVCards: (params: {
        addressBook: import(".").DAVAddressBook;
        headers?: Record<string, string>;
        objectUrls?: string[];
        urlFilter?: (url: string) => boolean;
        useMultiGet?: boolean;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVVCard[]>;
    createVCard: (params: {
        addressBook: import(".").DAVAddressBook;
        vCardString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    updateVCard: (params: {
        vCard: import(".").DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    deleteVCard: (params: {
        vCard: import(".").DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    fetchCalendarUserAddresses: (params: {
        account: import(".").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<string[]>;
    calendarQuery: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        filters?: import("xml-js").ElementCompact;
        timezone?: string;
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    calendarMultiGet: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        objectUrls?: string[];
        timezone?: string;
        depth: import(".").DAVDepth;
        filters?: import("xml-js").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    makeCalendar: (params: {
        url: string;
        props: import("xml-js").ElementCompact;
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse[]>;
    fetchCalendars: (params?: {
        account?: import(".").DAVAccount;
        props?: import("xml-js").ElementCompact;
        projectedProps?: Record<string, boolean>;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVCalendar[]>;
    fetchCalendarObjects: (params: {
        calendar: import(".").DAVCalendar;
        objectUrls?: string[];
        filters?: import("xml-js").ElementCompact;
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
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVCalendarObject[]>;
    createCalendarObject: (params: {
        calendar: import(".").DAVCalendar;
        iCalString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    updateCalendarObject: (params: {
        calendarObject: import(".").DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    deleteCalendarObject: (params: {
        calendarObject: import(".").DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<Response>;
    syncCalendars: import("./types/functionsOverloads").SyncCalendars;
    syncCalendarsDetailed: import("./types/functionsOverloads").SyncCalendarsDetailed;
    freeBusyQuery: (params: {
        url: string;
        timeRange: {
            start: string;
            end: string;
        };
        depth?: import(".").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof fetch;
    }) => Promise<import(".").DAVResponse>;
    serviceDiscovery: (params: {
        account: import(".").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<string>;
    fetchPrincipalUrl: (params: {
        account: import(".").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<string>;
    fetchHomeUrl: (params: {
        account: import(".").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<string>;
    createAccount: (params: {
        account: import(".").DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        loadCollections?: boolean;
        loadObjects?: boolean;
        fetchOptions?: RequestInit;
        fetch?: typeof import("./util/fetch").fetch;
    }) => Promise<import(".").DAVAccount>;
    defaultParam: <F extends (...args: any[]) => any>(fn: F, params: Partial<Parameters<F>[0]>) => (...args: Parameters<F>) => ReturnType<F>;
    getBasicAuthHeaders: (credentials: import(".").DAVCredentials) => {
        authorization?: string;
    };
    getBearerAuthHeaders: (credentials: import(".").DAVCredentials) => {
        authorization?: string;
    };
    fetchOauthTokens: (credentials: import(".").DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof import("./util/fetch").fetch) => Promise<import(".").DAVTokens>;
    refreshAccessToken: (credentials: import(".").DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof import("./util/fetch").fetch) => Promise<import(".").DAVTokens>;
    getOauthHeaders: (credentials: import(".").DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof import("./util/fetch").fetch) => Promise<{
        tokens: import(".").DAVTokens;
        headers: {
            authorization?: string;
        };
    }>;
    createDAVClient: (params: {
        serverUrl: string;
        credentials: import(".").DAVCredentials;
        authMethod?: 'Basic' | 'Oauth' | 'Digest' | 'Custom' | 'Bearer';
        authFunction?: (credentials: import(".").DAVCredentials) => Promise<Record<string, string>>;
        defaultAccountType?: import(".").DAVAccount['accountType'] | undefined;
        fetchOptions?: RequestInit;
        fetch?: typeof globalThis.fetch;
    }) => Promise<{
        davRequest: (params0: {
            url: string;
            init: import(".").DAVRequest;
            convertIncoming?: boolean;
            parseOutgoing?: boolean;
            fetchOptions?: RequestInit;
            fetch?: typeof globalThis.fetch;
        }) => Promise<import(".").DAVResponse[]>;
        propfind: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            depth?: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof import("./util/fetch").fetch;
        }) => Promise<import(".").DAVResponse[]>;
        createAccount: (params0: {
            account: import("./util/typeHelpers").Optional<import(".").DAVAccount, 'serverUrl'>;
            headers?: Record<string, string>;
            loadCollections?: boolean;
            loadObjects?: boolean;
            fetchOptions?: RequestInit;
            fetch?: typeof globalThis.fetch;
        }) => Promise<import(".").DAVAccount>;
        createObject: (params: {
            url: string;
            data: BodyInit;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof import("./util/fetch").fetch;
        }) => Promise<Response>;
        updateObject: (params: {
            url: string;
            data: BodyInit;
            etag?: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof import("./util/fetch").fetch;
        }) => Promise<Response>;
        deleteObject: (params: {
            url: string;
            etag?: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof import("./util/fetch").fetch;
        }) => Promise<Response>;
        calendarQuery: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            filters?: import("xml-js").ElementCompact;
            timezone?: string;
            depth?: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        addressBookQuery: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            filters?: import("xml-js").ElementCompact;
            depth?: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        collectionQuery: (params: {
            url: string;
            body: any;
            depth?: import(".").DAVDepth;
            defaultNamespace?: DAVNamespaceShort;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        makeCollection: (params: {
            url: string;
            props?: import("xml-js").ElementCompact;
            depth?: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        calendarMultiGet: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            objectUrls?: string[];
            timezone?: string;
            depth: import(".").DAVDepth;
            filters?: import("xml-js").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        makeCalendar: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            depth?: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        syncCollection: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            syncLevel?: number;
            syncToken?: string;
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        supportedReportSet: (params: {
            collection: import(".").DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<string[]>;
        isCollectionDirty: (params: {
            collection: import(".").DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<{
            isDirty: boolean;
            newCtag: string;
        }>;
        smartCollectionSync: import("./types/functionsOverloads").SmartCollectionSync;
        smartCollectionSyncDetailed: import("./types/functionsOverloads").SmartCollectionSyncDetailed;
        fetchCalendars: (params?: {
            account?: import(".").DAVAccount;
            props?: import("xml-js").ElementCompact;
            projectedProps?: Record<string, boolean>;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        } | undefined) => Promise<import(".").DAVCalendar[]>;
        fetchCalendarUserAddresses: (params: {
            account: import(".").DAVAccount;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<string[]>;
        fetchCalendarObjects: (params: {
            calendar: import(".").DAVCalendar;
            objectUrls?: string[];
            filters?: import("xml-js").ElementCompact;
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
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVObject[]>;
        createCalendarObject: (params: {
            calendar: import(".").DAVCalendar;
            iCalString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<Response>;
        updateCalendarObject: (params: {
            calendarObject: import(".").DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<Response>;
        deleteCalendarObject: (params: {
            calendarObject: import(".").DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<Response>;
        syncCalendars: import("./types/functionsOverloads").SyncCalendars;
        syncCalendarsDetailed: import("./types/functionsOverloads").SyncCalendarsDetailed;
        fetchAddressBooks: (params?: {
            account?: import(".").DAVAccount;
            props?: import("xml-js").ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        } | undefined) => Promise<import(".").DAVCollection[]>;
        addressBookMultiGet: (params: {
            url: string;
            props: import("xml-js").ElementCompact;
            objectUrls: string[];
            depth: import(".").DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVResponse[]>;
        fetchVCards: (params: {
            addressBook: import(".").DAVAddressBook;
            headers?: Record<string, string>;
            objectUrls?: string[];
            urlFilter?: (url: string) => boolean;
            useMultiGet?: boolean;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<import(".").DAVObject[]>;
        createVCard: (params: {
            addressBook: import(".").DAVAddressBook;
            vCardString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<Response>;
        updateVCard: (params: {
            vCard: import(".").DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
        }) => Promise<Response>;
        deleteVCard: (params: {
            vCard: import(".").DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
            fetch?: typeof fetch;
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

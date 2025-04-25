import { ElementCompact } from 'xml-js';
import * as xml_js_types from 'xml-js/types';

type DAVDepth = '0' | '1' | 'infinity';
type DAVMethods = 'COPY' | 'LOCK' | 'MKCOL' | 'MOVE' | 'PROPFIND' | 'PROPPATCH' | 'UNLOCK' | 'REPORT' | 'SEARCH' | 'MKCALENDAR';
type HTTPMethods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
type DAVResponse = {
    raw?: any;
    href?: string;
    status: number;
    statusText: string;
    ok: boolean;
    error?: {
        [key: string]: any;
    };
    responsedescription?: string;
    props?: {
        [key: string]: {
            status: number;
            statusText: string;
            ok: boolean;
            value: any;
        } | any;
    };
};
type DAVRequest = {
    headers?: Record<string, string>;
    method: DAVMethods | HTTPMethods;
    body: any;
    namespace?: string;
    attributes?: Record<string, string>;
};
type DAVTokens = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    token_type?: string;
    scope?: string;
};

type DAVCollection = {
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
type DAVObject = {
    data?: any;
    etag?: string;
    url: string;
};
type DAVCredentials = {
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
type DAVAccount = {
    accountType: 'caldav' | 'carddav';
    serverUrl: string;
    credentials?: DAVCredentials;
    rootUrl?: string;
    principalUrl?: string;
    homeUrl?: string;
    calendars?: DAVCalendar[];
    addressBooks?: DAVAddressBook[];
};
type DAVVCard = DAVObject;
type DAVCalendarObject = DAVObject;
type DAVAddressBook = DAVCollection;
type DAVCalendar = {
    components?: string[];
    timezone?: string;
    projectedProps?: Record<string, unknown>;
    calendarColor?: string;
} & DAVCollection;

interface SmartCollectionSync {
    <T extends DAVCollection>(param: {
        collection: T;
        method?: 'basic' | 'webdav';
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult: true;
    }): Promise<Omit<T, 'objects'> & {
        objects: {
            created: DAVObject[];
            updated: DAVObject[];
            deleted: DAVObject[];
        };
    }>;
    <T extends DAVCollection>(param: {
        collection: T;
        method?: 'basic' | 'webdav';
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult?: false;
    }): Promise<T>;
}
interface SyncCalendars {
    (params: {
        oldCalendars: DAVCalendar[];
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult: true;
    }): Promise<{
        created: DAVCalendar[];
        updated: DAVCalendar[];
        deleted: DAVCalendar[];
    }>;
    (params: {
        oldCalendars: DAVCalendar[];
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult?: false;
    }): Promise<DAVCalendar[]>;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type NoUndefinedField<T> = {
    [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>;
};

declare enum DAVNamespace {
    CALENDAR_SERVER = "http://calendarserver.org/ns/",
    CALDAV_APPLE = "http://apple.com/ns/ical/",
    CALDAV = "urn:ietf:params:xml:ns:caldav",
    CARDDAV = "urn:ietf:params:xml:ns:carddav",
    DAV = "DAV:"
}
declare const DAVAttributeMap: {
    "urn:ietf:params:xml:ns:caldav": string;
    "urn:ietf:params:xml:ns:carddav": string;
    "http://calendarserver.org/ns/": string;
    "http://apple.com/ns/ical/": string;
    "DAV:": string;
};
declare enum DAVNamespaceShort {
    CALDAV = "c",
    CARDDAV = "card",
    CALENDAR_SERVER = "cs",
    CALDAV_APPLE = "ca",
    DAV = "d"
}

declare const addressBookQuery: (params: {
    url: string;
    props: ElementCompact;
    filters?: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const addressBookMultiGet: (params: {
    url: string;
    props: ElementCompact;
    objectUrls: string[];
    depth: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const fetchAddressBooks: (params?: {
    account?: DAVAccount;
    props?: ElementCompact;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVAddressBook[]>;
declare const fetchVCards: (params: {
    addressBook: DAVAddressBook;
    headers?: Record<string, string>;
    objectUrls?: string[];
    urlFilter?: (url: string) => boolean;
    useMultiGet?: boolean;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVVCard[]>;
declare const createVCard: (params: {
    addressBook: DAVAddressBook;
    vCardString: string;
    filename: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const updateVCard: (params: {
    vCard: DAVVCard;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const deleteVCard: (params: {
    vCard: DAVVCard;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;

declare const fetchCalendarUserAddresses: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<string[]>;
declare const calendarQuery: (params: {
    url: string;
    props: ElementCompact;
    filters?: ElementCompact;
    timezone?: string;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const calendarMultiGet: (params: {
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
declare const makeCalendar: (params: {
    url: string;
    props: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const fetchCalendars: (params?: {
    account?: DAVAccount;
    props?: ElementCompact;
    projectedProps?: Record<string, boolean>;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVCalendar[]>;
declare const fetchCalendarObjects: (params: {
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
declare const createCalendarObject: (params: {
    calendar: DAVCalendar;
    iCalString: string;
    filename: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const updateCalendarObject: (params: {
    calendarObject: DAVCalendarObject;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const deleteCalendarObject: (params: {
    calendarObject: DAVCalendarObject;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
/**
 * Sync remote calendars to local
 */
declare const syncCalendars: SyncCalendars;
declare const freeBusyQuery: (params: {
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

declare const collectionQuery: (params: {
    url: string;
    body: any;
    depth?: DAVDepth;
    defaultNamespace?: DAVNamespaceShort;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const makeCollection: (params: {
    url: string;
    props?: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const supportedReportSet: (params: {
    collection: DAVCollection;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<string[]>;
declare const isCollectionDirty: (params: {
    collection: DAVCollection;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<{
    isDirty: boolean;
    newCtag: string;
}>;
/**
 * This is for webdav sync-collection only
 */
declare const syncCollection: (params: {
    url: string;
    props: ElementCompact;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    syncLevel?: number;
    syncToken?: string;
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
/** remote collection to local */
declare const smartCollectionSync: SmartCollectionSync;

declare const davRequest: (params: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const propfind: (params: {
    url: string;
    props: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
declare const createObject: (params: {
    url: string;
    data: BodyInit;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const updateObject: (params: {
    url: string;
    data: BodyInit;
    etag?: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
declare const deleteObject: (params: {
    url: string;
    etag?: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;

declare const createDAVClient: (params: {
    serverUrl: string;
    credentials: DAVCredentials;
    authMethod?: "Basic" | "Oauth" | "Digest" | "Custom";
    authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
    defaultAccountType?: DAVAccount["accountType"] | undefined;
}) => Promise<{
    davRequest: (params0: {
        url: string;
        init: DAVRequest;
        convertIncoming?: boolean;
        parseOutgoing?: boolean;
    }) => Promise<DAVResponse[]>;
    propfind: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    createAccount: (params0: {
        account: Optional<DAVAccount, "serverUrl">;
        headers?: Record<string, string>;
        loadCollections?: boolean;
        loadObjects?: boolean;
    }) => Promise<DAVAccount>;
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
        props: xml_js_types.ElementCompact;
        filters?: xml_js_types.ElementCompact;
        timezone?: string;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    addressBookQuery: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        filters?: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    collectionQuery: (params: {
        url: string;
        body: any;
        depth?: DAVDepth;
        defaultNamespace?: DAVNamespaceShort;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    makeCollection: (params: {
        url: string;
        props?: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    calendarMultiGet: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        objectUrls?: string[];
        timezone?: string;
        depth: DAVDepth;
        filters?: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    makeCalendar: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    syncCollection: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        syncLevel?: number;
        syncToken?: string;
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    supportedReportSet: (params: {
        collection: DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    isCollectionDirty: (params: {
        collection: DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<{
        isDirty: boolean;
        newCtag: string;
    }>;
    smartCollectionSync: SmartCollectionSync;
    fetchCalendars: (params?: {
        account?: DAVAccount;
        props?: xml_js_types.ElementCompact;
        projectedProps?: Record<string, boolean>;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    } | undefined) => Promise<DAVCalendar[]>;
    fetchCalendarUserAddresses: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    fetchCalendarObjects: (params: {
        calendar: DAVCalendar;
        objectUrls?: string[];
        filters?: xml_js_types.ElementCompact;
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
    }) => Promise<DAVObject[]>;
    createCalendarObject: (params: {
        calendar: DAVCalendar;
        iCalString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateCalendarObject: (params: {
        calendarObject: DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteCalendarObject: (params: {
        calendarObject: DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    syncCalendars: SyncCalendars;
    fetchAddressBooks: (params?: {
        account?: DAVAccount;
        props?: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    } | undefined) => Promise<DAVCollection[]>;
    addressBookMultiGet: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        objectUrls: string[];
        depth: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    fetchVCards: (params: {
        addressBook: DAVAddressBook;
        headers?: Record<string, string>;
        objectUrls?: string[];
        urlFilter?: (url: string) => boolean;
        useMultiGet?: boolean;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVObject[]>;
    createVCard: (params: {
        addressBook: DAVAddressBook;
        vCardString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateVCard: (params: {
        vCard: DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteVCard: (params: {
        vCard: DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
}>;
declare class DAVClient {
    serverUrl: string;
    credentials: DAVCredentials;
    authMethod: 'Basic' | 'Oauth' | 'Digest' | 'Custom';
    accountType: DAVAccount['accountType'];
    authHeaders?: Record<string, string>;
    account?: DAVAccount;
    fetchOptions?: RequestInit;
    authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
    constructor(params: {
        serverUrl: string;
        credentials: DAVCredentials;
        authMethod?: 'Basic' | 'Oauth' | 'Digest' | 'Custom';
        authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
        defaultAccountType?: DAVAccount['accountType'] | undefined;
        fetchOptions?: RequestInit;
    });
    login(): Promise<void>;
    davRequest(params0: {
        url: string;
        init: DAVRequest;
        convertIncoming?: boolean;
        parseOutgoing?: boolean;
        fetchOptions?: RequestInit;
    }): Promise<DAVResponse[]>;
    createObject(...params: Parameters<typeof createObject>): Promise<Response>;
    updateObject(...params: Parameters<typeof updateObject>): Promise<Response>;
    deleteObject(...params: Parameters<typeof deleteObject>): Promise<Response>;
    propfind(...params: Parameters<typeof propfind>): Promise<DAVResponse[]>;
    createAccount(params0: {
        account: Optional<DAVAccount, 'serverUrl'>;
        headers?: Record<string, string>;
        loadCollections?: boolean;
        loadObjects?: boolean;
        fetchOptions?: RequestInit;
    }): Promise<DAVAccount>;
    collectionQuery(...params: Parameters<typeof collectionQuery>): Promise<DAVResponse[]>;
    makeCollection(...params: Parameters<typeof makeCollection>): Promise<DAVResponse[]>;
    syncCollection(...params: Parameters<typeof syncCollection>): Promise<DAVResponse[]>;
    supportedReportSet(...params: Parameters<typeof supportedReportSet>): Promise<string[]>;
    isCollectionDirty(...params: Parameters<typeof isCollectionDirty>): Promise<{
        isDirty: boolean;
        newCtag: string;
    }>;
    smartCollectionSync<T extends DAVCollection>(param: {
        collection: T;
        method?: 'basic' | 'webdav';
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult?: false;
    }): Promise<T>;
    smartCollectionSync<T extends DAVCollection>(param: {
        collection: T;
        method?: 'basic' | 'webdav';
        headers?: Record<string, string>;
        fetchOptions?: RequestInit;
        account?: DAVAccount;
        detailedResult: true;
    }): Promise<Omit<T, 'objects'> & {
        objects: {
            created: DAVObject[];
            updated: DAVObject[];
            deleted: DAVObject[];
        };
    }>;
    calendarQuery(...params: Parameters<typeof calendarQuery>): Promise<DAVResponse[]>;
    makeCalendar(...params: Parameters<typeof makeCalendar>): Promise<DAVResponse[]>;
    calendarMultiGet(...params: Parameters<typeof calendarMultiGet>): Promise<DAVResponse[]>;
    fetchCalendars(...params: Parameters<typeof fetchCalendars>): Promise<DAVCalendar[]>;
    fetchCalendarUserAddresses(...params: Parameters<typeof fetchCalendarUserAddresses>): Promise<string[]>;
    fetchCalendarObjects(...params: Parameters<typeof fetchCalendarObjects>): Promise<DAVCalendarObject[]>;
    createCalendarObject(...params: Parameters<typeof createCalendarObject>): Promise<Response>;
    updateCalendarObject(...params: Parameters<typeof updateCalendarObject>): Promise<Response>;
    deleteCalendarObject(...params: Parameters<typeof deleteCalendarObject>): Promise<Response>;
    syncCalendars(...params: Parameters<SyncCalendars>): Promise<ReturnType<SyncCalendars>>;
    addressBookQuery(...params: Parameters<typeof addressBookQuery>): Promise<DAVResponse[]>;
    addressBookMultiGet(...params: Parameters<typeof addressBookMultiGet>): Promise<DAVResponse[]>;
    fetchAddressBooks(...params: Parameters<typeof fetchAddressBooks>): Promise<DAVAddressBook[]>;
    fetchVCards(...params: Parameters<typeof fetchVCards>): Promise<DAVVCard[]>;
    createVCard(...params: Parameters<typeof createVCard>): Promise<Response>;
    updateVCard(...params: Parameters<typeof updateVCard>): Promise<Response>;
    deleteVCard(...params: Parameters<typeof deleteVCard>): Promise<Response>;
}

declare const createAccount: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
}) => Promise<DAVAccount>;

declare const getBasicAuthHeaders: (credentials: DAVCredentials) => {
    authorization?: string;
};
declare const fetchOauthTokens: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<DAVTokens>;
declare const refreshAccessToken: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<{
    access_token?: string;
    expires_in?: number;
}>;
declare const getOauthHeaders: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<{
    tokens: DAVTokens;
    headers: {
        authorization?: string;
    };
}>;

declare const urlEquals: (urlA?: string, urlB?: string) => boolean;
declare const urlContains: (urlA?: string, urlB?: string) => boolean;
declare const getDAVAttribute: (nsArr: DAVNamespace[]) => {
    [key: string]: DAVNamespace;
};
declare const cleanupFalsy: <T extends object = object>(obj: T) => NoUndefinedField<T>;

declare const _default: {
    urlEquals: (urlA?: string, urlB?: string) => boolean;
    urlContains: (urlA?: string, urlB?: string) => boolean;
    getDAVAttribute: (nsArr: DAVNamespace[]) => {
        [key: string]: DAVNamespace;
    };
    cleanupFalsy: <T extends object = object>(obj: T) => NoUndefinedField<T>;
    conditionalParam: <T>(key: string, param: T) => {
        [key: string]: T;
    };
    excludeHeaders: (headers: Record<string, string> | undefined, headersToExclude: string[] | undefined) => Record<string, string>;
    defaultParam: <F extends (...args: any[]) => any>(fn: F, params: Partial<Parameters<F>[0]>) => (...args: Parameters<F>) => ReturnType<F>;
    getBasicAuthHeaders: (credentials: DAVCredentials) => {
        authorization?: string;
    };
    fetchOauthTokens: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<DAVTokens>;
    refreshAccessToken: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<{
        access_token?: string;
        expires_in?: number;
    }>;
    getOauthHeaders: (credentials: DAVCredentials, fetchOptions?: RequestInit) => Promise<{
        tokens: DAVTokens;
        headers: {
            authorization?: string;
        };
    }>;
    fetchCalendarUserAddresses: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    calendarQuery: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        filters?: xml_js_types.ElementCompact;
        timezone?: string;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    calendarMultiGet: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        objectUrls?: string[];
        timezone?: string;
        depth: DAVDepth;
        filters?: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    makeCalendar: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    fetchCalendars: (params?: {
        account?: DAVAccount;
        props?: xml_js_types.ElementCompact;
        projectedProps?: Record<string, boolean>;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVCalendar[]>;
    fetchCalendarObjects: (params: {
        calendar: DAVCalendar;
        objectUrls?: string[];
        filters?: xml_js_types.ElementCompact;
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
    createCalendarObject: (params: {
        calendar: DAVCalendar;
        iCalString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateCalendarObject: (params: {
        calendarObject: DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteCalendarObject: (params: {
        calendarObject: DAVCalendarObject;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    syncCalendars: SyncCalendars;
    freeBusyQuery: (params: {
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
    addressBookQuery: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        filters?: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    addressBookMultiGet: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        objectUrls: string[];
        depth: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    fetchAddressBooks: (params?: {
        account?: DAVAccount;
        props?: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVAddressBook[]>;
    fetchVCards: (params: {
        addressBook: DAVAddressBook;
        headers?: Record<string, string>;
        objectUrls?: string[];
        urlFilter?: (url: string) => boolean;
        useMultiGet?: boolean;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVVCard[]>;
    createVCard: (params: {
        addressBook: DAVAddressBook;
        vCardString: string;
        filename: string;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    updateVCard: (params: {
        vCard: DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    deleteVCard: (params: {
        vCard: DAVVCard;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<Response>;
    serviceDiscovery: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    fetchPrincipalUrl: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    fetchHomeUrl: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string>;
    createAccount: (params: {
        account: DAVAccount;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        loadCollections?: boolean;
        loadObjects?: boolean;
        fetchOptions?: RequestInit;
    }) => Promise<DAVAccount>;
    collectionQuery: (params: {
        url: string;
        body: any;
        depth?: DAVDepth;
        defaultNamespace?: DAVNamespaceShort;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    makeCollection: (params: {
        url: string;
        props?: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    supportedReportSet: (params: {
        collection: DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<string[]>;
    isCollectionDirty: (params: {
        collection: DAVCollection;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<{
        isDirty: boolean;
        newCtag: string;
    }>;
    syncCollection: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        syncLevel?: number;
        syncToken?: string;
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    smartCollectionSync: SmartCollectionSync;
    davRequest: (params: {
        url: string;
        init: DAVRequest;
        convertIncoming?: boolean;
        parseOutgoing?: boolean;
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    propfind: (params: {
        url: string;
        props: xml_js_types.ElementCompact;
        depth?: DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
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
        credentials: DAVCredentials;
        authMethod?: "Basic" | "Oauth" | "Digest" | "Custom";
        authFunction?: (credentials: DAVCredentials) => Promise<Record<string, string>>;
        defaultAccountType?: DAVAccount["accountType"] | undefined;
    }) => Promise<{
        davRequest: (params0: {
            url: string;
            init: DAVRequest;
            convertIncoming?: boolean;
            parseOutgoing?: boolean;
        }) => Promise<DAVResponse[]>;
        propfind: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            depth?: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        createAccount: (params0: {
            account: Optional<DAVAccount, "serverUrl">;
            headers?: Record<string, string>;
            loadCollections?: boolean;
            loadObjects?: boolean;
        }) => Promise<DAVAccount>;
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
            props: xml_js_types.ElementCompact;
            filters?: xml_js_types.ElementCompact;
            timezone?: string;
            depth?: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        addressBookQuery: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            filters?: xml_js_types.ElementCompact;
            depth?: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        collectionQuery: (params: {
            url: string;
            body: any;
            depth?: DAVDepth;
            defaultNamespace?: DAVNamespaceShort;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        makeCollection: (params: {
            url: string;
            props?: xml_js_types.ElementCompact;
            depth?: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        calendarMultiGet: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            objectUrls?: string[];
            timezone?: string;
            depth: DAVDepth;
            filters?: xml_js_types.ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        makeCalendar: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            depth?: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        syncCollection: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            syncLevel?: number;
            syncToken?: string;
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        supportedReportSet: (params: {
            collection: DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<string[]>;
        isCollectionDirty: (params: {
            collection: DAVCollection;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<{
            isDirty: boolean;
            newCtag: string;
        }>;
        smartCollectionSync: SmartCollectionSync;
        fetchCalendars: (params?: {
            account?: DAVAccount;
            props?: xml_js_types.ElementCompact;
            projectedProps?: Record<string, boolean>;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        } | undefined) => Promise<DAVCalendar[]>;
        fetchCalendarUserAddresses: (params: {
            account: DAVAccount;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<string[]>;
        fetchCalendarObjects: (params: {
            calendar: DAVCalendar;
            objectUrls?: string[];
            filters?: xml_js_types.ElementCompact;
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
        }) => Promise<DAVObject[]>;
        createCalendarObject: (params: {
            calendar: DAVCalendar;
            iCalString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        updateCalendarObject: (params: {
            calendarObject: DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        deleteCalendarObject: (params: {
            calendarObject: DAVCalendarObject;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        syncCalendars: SyncCalendars;
        fetchAddressBooks: (params?: {
            account?: DAVAccount;
            props?: xml_js_types.ElementCompact;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        } | undefined) => Promise<DAVCollection[]>;
        addressBookMultiGet: (params: {
            url: string;
            props: xml_js_types.ElementCompact;
            objectUrls: string[];
            depth: DAVDepth;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVResponse[]>;
        fetchVCards: (params: {
            addressBook: DAVAddressBook;
            headers?: Record<string, string>;
            objectUrls?: string[];
            urlFilter?: (url: string) => boolean;
            useMultiGet?: boolean;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<DAVObject[]>;
        createVCard: (params: {
            addressBook: DAVAddressBook;
            vCardString: string;
            filename: string;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        updateVCard: (params: {
            vCard: DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
        deleteVCard: (params: {
            vCard: DAVVCard;
            headers?: Record<string, string>;
            headersToExclude?: string[];
            fetchOptions?: RequestInit;
        }) => Promise<Response>;
    }>;
    DAVClient: typeof DAVClient;
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

export { DAVAttributeMap, DAVClient, DAVNamespace, DAVNamespaceShort, addressBookMultiGet, addressBookQuery, calendarMultiGet, calendarQuery, cleanupFalsy, collectionQuery, createAccount, createCalendarObject, createDAVClient, createObject, createVCard, davRequest, _default as default, deleteCalendarObject, deleteObject, deleteVCard, fetchAddressBooks, fetchCalendarObjects, fetchCalendarUserAddresses, fetchCalendars, fetchOauthTokens, fetchVCards, freeBusyQuery, getBasicAuthHeaders, getDAVAttribute, getOauthHeaders, isCollectionDirty, makeCalendar, propfind, refreshAccessToken, smartCollectionSync, supportedReportSet, syncCalendars, syncCollection, updateCalendarObject, updateObject, updateVCard, urlContains, urlEquals };
export type { DAVAccount, DAVAddressBook, DAVCalendar, DAVCalendarObject, DAVCollection, DAVCredentials, DAVDepth, DAVMethods, DAVObject, DAVRequest, DAVResponse, DAVTokens, DAVVCard };

import { addressBookMultiGet as rawAddressBookMultiGet, addressBookQuery as rawAddressBookQuery, createVCard as rawCreateVCard, deleteVCard as rawDeleteVCard, fetchAddressBooks as rawFetchAddressBooks, fetchVCards as rawFetchVCards, updateVCard as rawUpdateVCard } from './addressBook';
import { calendarMultiGet as rawCalendarMultiGet, calendarQuery as rawCalendarQuery, createCalendarObject as rawCreateCalendarObject, deleteCalendarObject as rawDeleteCalendarObject, fetchCalendarObjects as rawFetchCalendarObjects, fetchCalendars as rawFetchCalendars, makeCalendar as rawMakeCalendar, updateCalendarObject as rawUpdateCalendarObject, fetchCalendarUserAddresses as rawFetchCalendarUserAddresses } from './calendar';
import { collectionQuery as rawCollectionQuery, isCollectionDirty as rawIsCollectionDirty, makeCollection as rawMakeCollection, supportedReportSet as rawSupportedReportSet, syncCollection as rawSyncCollection } from './collection';
import { createObject as rawCreateObject, deleteObject as rawDeleteObject, propfind as rawPropfind, updateObject as rawUpdateObject } from './request';
import { DAVRequest, DAVResponse } from './types/DAVTypes';
import { SmartCollectionSync, SyncCalendars } from './types/functionsOverloads';
import { DAVAccount, DAVAddressBook, DAVCalendar, DAVCalendarObject, DAVCollection, DAVCredentials, DAVObject, DAVVCard } from './types/models';
import { Optional } from './util/typeHelpers';
export declare const createDAVClient: (params: {
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
        props: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
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
        props: import("xml-js/types").ElementCompact;
        filters?: import("xml-js/types").ElementCompact;
        timezone?: string;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    addressBookQuery: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        filters?: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    collectionQuery: (params: {
        url: string;
        body: any;
        depth?: import("./types/DAVTypes").DAVDepth;
        defaultNamespace?: import("./consts").DAVNamespaceShort;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    makeCollection: (params: {
        url: string;
        props?: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
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
    }) => Promise<DAVResponse[]>;
    makeCalendar: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        depth?: import("./types/DAVTypes").DAVDepth;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    }) => Promise<DAVResponse[]>;
    syncCollection: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
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
        props?: import("xml-js/types").ElementCompact;
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
        props?: import("xml-js/types").ElementCompact;
        headers?: Record<string, string>;
        headersToExclude?: string[];
        fetchOptions?: RequestInit;
    } | undefined) => Promise<DAVCollection[]>;
    addressBookMultiGet: (params: {
        url: string;
        props: import("xml-js/types").ElementCompact;
        objectUrls: string[];
        depth: import("./types/DAVTypes").DAVDepth;
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
export declare class DAVClient {
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
    createObject(...params: Parameters<typeof rawCreateObject>): Promise<Response>;
    updateObject(...params: Parameters<typeof rawUpdateObject>): Promise<Response>;
    deleteObject(...params: Parameters<typeof rawDeleteObject>): Promise<Response>;
    propfind(...params: Parameters<typeof rawPropfind>): Promise<DAVResponse[]>;
    createAccount(params0: {
        account: Optional<DAVAccount, 'serverUrl'>;
        headers?: Record<string, string>;
        loadCollections?: boolean;
        loadObjects?: boolean;
        fetchOptions?: RequestInit;
    }): Promise<DAVAccount>;
    collectionQuery(...params: Parameters<typeof rawCollectionQuery>): Promise<DAVResponse[]>;
    makeCollection(...params: Parameters<typeof rawMakeCollection>): Promise<DAVResponse[]>;
    syncCollection(...params: Parameters<typeof rawSyncCollection>): Promise<DAVResponse[]>;
    supportedReportSet(...params: Parameters<typeof rawSupportedReportSet>): Promise<string[]>;
    isCollectionDirty(...params: Parameters<typeof rawIsCollectionDirty>): Promise<{
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
    calendarQuery(...params: Parameters<typeof rawCalendarQuery>): Promise<DAVResponse[]>;
    makeCalendar(...params: Parameters<typeof rawMakeCalendar>): Promise<DAVResponse[]>;
    calendarMultiGet(...params: Parameters<typeof rawCalendarMultiGet>): Promise<DAVResponse[]>;
    fetchCalendars(...params: Parameters<typeof rawFetchCalendars>): Promise<DAVCalendar[]>;
    fetchCalendarUserAddresses(...params: Parameters<typeof rawFetchCalendarUserAddresses>): Promise<string[]>;
    fetchCalendarObjects(...params: Parameters<typeof rawFetchCalendarObjects>): Promise<DAVCalendarObject[]>;
    createCalendarObject(...params: Parameters<typeof rawCreateCalendarObject>): Promise<Response>;
    updateCalendarObject(...params: Parameters<typeof rawUpdateCalendarObject>): Promise<Response>;
    deleteCalendarObject(...params: Parameters<typeof rawDeleteCalendarObject>): Promise<Response>;
    syncCalendars(...params: Parameters<SyncCalendars>): Promise<ReturnType<SyncCalendars>>;
    addressBookQuery(...params: Parameters<typeof rawAddressBookQuery>): Promise<DAVResponse[]>;
    addressBookMultiGet(...params: Parameters<typeof rawAddressBookMultiGet>): Promise<DAVResponse[]>;
    fetchAddressBooks(...params: Parameters<typeof rawFetchAddressBooks>): Promise<DAVAddressBook[]>;
    fetchVCards(...params: Parameters<typeof rawFetchVCards>): Promise<DAVVCard[]>;
    createVCard(...params: Parameters<typeof rawCreateVCard>): Promise<Response>;
    updateVCard(...params: Parameters<typeof rawUpdateVCard>): Promise<Response>;
    deleteVCard(...params: Parameters<typeof rawDeleteVCard>): Promise<Response>;
}

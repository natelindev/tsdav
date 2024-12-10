import { DAVAccount, DAVCalendar, DAVCollection, DAVObject } from './models';
export interface SmartCollectionSync {
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
export interface SyncCalendars {
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

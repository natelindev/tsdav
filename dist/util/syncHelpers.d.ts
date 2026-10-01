import { DAVObject } from '../types/models';
/** Stable keys for linear-time DAV resource comparisons. */
export declare const getDAVUrlKey: (url: string, baseUrl: string) => string;
export declare const diffDAVObjects: (local: DAVObject[], remote: DAVObject[], baseUrl: string, incremental?: boolean, deletedObjects?: DAVObject[]) => {
    created: DAVObject[];
    updated: DAVObject[];
    deleted: DAVObject[];
    unchanged: DAVObject[];
};

import { ElementCompact } from 'xml-js';
import { DAVNamespaceShort } from './consts';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { SmartCollectionSync } from './types/functionsOverloads';
import { DAVCollection } from './types/models';
export declare const collectionQuery: (params: {
    url: string;
    body: any;
    depth?: DAVDepth;
    defaultNamespace?: DAVNamespaceShort;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const makeCollection: (params: {
    url: string;
    props?: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const supportedReportSet: (params: {
    collection: DAVCollection;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<string[]>;
export declare const isCollectionDirty: (params: {
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
export declare const syncCollection: (params: {
    url: string;
    props: ElementCompact;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    syncLevel?: number;
    syncToken?: string;
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
/** remote collection to local */
export declare const smartCollectionSync: SmartCollectionSync;

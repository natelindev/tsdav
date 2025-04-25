import { ElementCompact } from 'xml-js';
import { DAVDepth, DAVRequest, DAVResponse } from './types/DAVTypes';
export declare const davRequest: (params: {
    url: string;
    init: DAVRequest;
    convertIncoming?: boolean;
    parseOutgoing?: boolean;
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const propfind: (params: {
    url: string;
    props: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const createObject: (params: {
    url: string;
    data: BodyInit;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const updateObject: (params: {
    url: string;
    data: BodyInit;
    etag?: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const deleteObject: (params: {
    url: string;
    etag?: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;

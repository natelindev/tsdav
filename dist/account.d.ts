import { fetch } from 'cross-fetch';
import { DAVAccount } from './types/models';
export declare const serviceDiscovery: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof fetch;
}) => Promise<string>;
export declare const fetchPrincipalUrl: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof fetch;
}) => Promise<string>;
export declare const fetchHomeUrl: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
    fetch?: typeof fetch;
}) => Promise<string>;
export declare const createAccount: (params: {
    account: DAVAccount;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    loadCollections?: boolean;
    loadObjects?: boolean;
    fetchOptions?: RequestInit;
    fetch?: typeof fetch;
}) => Promise<DAVAccount>;

import { ElementCompact } from 'xml-js';
import { DAVDepth, DAVResponse } from './types/DAVTypes';
import { DAVAccount, DAVAddressBook, DAVVCard } from './types/models';
export declare const addressBookQuery: (params: {
    url: string;
    props: ElementCompact;
    filters?: ElementCompact;
    depth?: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const addressBookMultiGet: (params: {
    url: string;
    props: ElementCompact;
    objectUrls: string[];
    depth: DAVDepth;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVResponse[]>;
export declare const fetchAddressBooks: (params?: {
    account?: DAVAccount;
    props?: ElementCompact;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVAddressBook[]>;
export declare const fetchVCards: (params: {
    addressBook: DAVAddressBook;
    headers?: Record<string, string>;
    objectUrls?: string[];
    urlFilter?: (url: string) => boolean;
    useMultiGet?: boolean;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<DAVVCard[]>;
export declare const createVCard: (params: {
    addressBook: DAVAddressBook;
    vCardString: string;
    filename: string;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const updateVCard: (params: {
    vCard: DAVVCard;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;
export declare const deleteVCard: (params: {
    vCard: DAVVCard;
    headers?: Record<string, string>;
    headersToExclude?: string[];
    fetchOptions?: RequestInit;
}) => Promise<Response>;

import { DAVResponse } from '../types/DAVTypes';
export declare const assertDAVResponses: (responses: DAVResponse[], context: string) => void;
export declare const assertDAVDiscovery: (responses: DAVResponse[], context: string) => void;
export declare const assertDAVProperty: (response: DAVResponse, name: string, context: string) => void;
export declare const assertDAVObjectResponses: (responses: DAVResponse[], property: string, objectUrls: string[], baseUrl: string, context: string) => void;
export declare const getDAVText: (value: any) => string | undefined;

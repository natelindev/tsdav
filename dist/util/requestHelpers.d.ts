import { DAVNamespace } from '../consts';
import type { NoUndefinedField } from './typeHelpers';
export declare const urlEquals: (urlA?: string, urlB?: string) => boolean;
export declare const urlContains: (urlA?: string, urlB?: string) => boolean;
export declare const getDAVAttribute: (nsArr: DAVNamespace[]) => {
    [key: string]: DAVNamespace;
};
export declare const cleanupFalsy: <T extends object = object>(obj: T) => NoUndefinedField<T>;
export declare const conditionalParam: <T>(key: string, param: T) => {
    [key: string]: T;
};
export declare const excludeHeaders: (headers: Record<string, string> | undefined, headersToExclude: string[] | undefined) => Record<string, string>;

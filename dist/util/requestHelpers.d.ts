import { DAVNamespace } from '../consts';
import type { NoUndefinedField } from './typeHelpers';
/**
 * Strict URL equality after trimming whitespace and a single trailing slash.
 * Two URLs are equal if and only if their normalized forms are identical.
 */
export declare const urlEquals: (urlA?: string, urlB?: string) => boolean;
/**
 * Loose URL containment check used for matching DAV responses against known
 * collection/principal URLs. Tolerates trailing slashes and partial vs. full
 * URLs (e.g. "www.example.com" vs. "https://www.example.com/").
 *
 * NOTE: this is intentionally permissive to accommodate DAV servers that
 * return hrefs as paths instead of full URLs. Callers MUST only compare URLs
 * at the same hierarchy level (collection-to-collection, object-to-object).
 * Comparing a collection URL against an object URL will produce false
 * positives because the collection URL is a prefix of the object URL.
 */
export declare const urlContains: (urlA?: string, urlB?: string) => boolean;
export declare const getDAVAttribute: (nsArr: DAVNamespace[]) => {
    [key: string]: DAVNamespace;
};
export declare const cleanupFalsy: <T extends object = object>(obj: T) => NoUndefinedField<T>;
export declare const conditionalParam: <T>(key: string, param: T) => {
    [key: string]: T;
};
export declare const excludeHeaders: (headers: Record<string, string> | undefined, headersToExclude: string[] | undefined) => Record<string, string>;

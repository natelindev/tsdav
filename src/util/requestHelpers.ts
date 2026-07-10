import { DAVAttributeMap, DAVNamespace } from '../consts';

import type { NoUndefinedField } from './typeHelpers';

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

/**
 * Strict URL equality after trimming whitespace and a single trailing slash.
 * Two URLs are equal if and only if their normalized forms are identical.
 */
export const urlEquals = (urlA?: string, urlB?: string): boolean => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }
  return normalizeUrl(urlA) === normalizeUrl(urlB);
};

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
export const urlContains = (urlA?: string, urlB?: string): boolean => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }

  const strippedUrlA = normalizeUrl(urlA);
  const strippedUrlB = normalizeUrl(urlB);
  return strippedUrlA.includes(strippedUrlB) || strippedUrlB.includes(strippedUrlA);
};

/**
 * Compare two DAV hrefs as resource identifiers after resolving relative
 * hrefs against the same collection or account URL.
 */
export const urlMatches = (urlA?: string, urlB?: string, baseUrl?: string): boolean => {
  if (!urlA || !urlB || !baseUrl) {
    return urlEquals(urlA, urlB);
  }

  try {
    return urlEquals(new URL(urlA, baseUrl).href, new URL(urlB, baseUrl).href);
  } catch {
    return urlEquals(urlA, urlB);
  }
};

export const getDAVAttribute = (nsArr: DAVNamespace[]): { [key: string]: DAVNamespace } =>
  nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});

export const cleanupFalsy = <T extends object = object>(obj: T): NoUndefinedField<T> =>
  Object.entries(obj).reduce(
    (prev, [key, value]) => {
      if (value) return { ...prev, [key]: value };
      return prev;
    },
    {} as NoUndefinedField<T>,
  );

export const conditionalParam = <T>(key: string, param: T) => {
  if (param) {
    return {
      [key]: param,
    } as { [key: string]: T };
  }
  return {} as Record<string, never>;
};

export const excludeHeaders = (
  headers: Record<string, string> | undefined,
  headersToExclude: string[] | undefined,
): Record<string, string> => {
  if (!headers) {
    return {};
  }
  if (!headersToExclude || headersToExclude.length === 0) {
    return headers;
  }

  // HTTP headers are case-insensitive, so normalize both sides before comparing
  const excludeSet = new Set(headersToExclude.map((h) => h.toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !excludeSet.has(key.toLowerCase())),
  );
};

/** Merge all valid HeadersInit forms with case-insensitive last-write-wins semantics. */
export const mergeHeaders = (
  ...headerSources: Array<HeadersInit | undefined>
): Record<string, string> => {
  const headersByLowercaseName = new Map<string, [string, string]>();

  const setHeader = (name: string, value: string): void => {
    headersByLowercaseName.set(name.toLowerCase(), [name, value]);
  };

  for (const source of headerSources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const [name, value] of source) {
        setHeader(name, value);
      }
      continue;
    }

    if (typeof (source as Headers).forEach === 'function') {
      (source as Headers).forEach((value, name) => {
        setHeader(name, value);
      });
      continue;
    }

    for (const [name, value] of Object.entries(source)) {
      setHeader(name, value);
    }
  }

  return Object.fromEntries(headersByLowercaseName.values());
};

import { DAVObject } from '../types/models';
import { ensureTrailingSlash } from './requestHelpers';

/** Stable keys for linear-time DAV resource comparisons. */
export const getDAVUrlKey = (url: string, baseUrl: string): string => {
  let resolved: string;
  try {
    resolved = new URL(url, ensureTrailingSlash(baseUrl)).href;
  } catch {
    resolved = url.trim();
  }
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
};

export const diffDAVObjects = (
  local: DAVObject[],
  remote: DAVObject[],
  baseUrl: string,
  incremental = false,
  deletedObjects: DAVObject[] = [],
) => {
  const localByUrl = new Map(local.map((object) => [getDAVUrlKey(object.url, baseUrl), object]));
  const remoteByUrl = new Map(remote.map((object) => [getDAVUrlKey(object.url, baseUrl), object]));
  const deleted = incremental
    ? deletedObjects
    : local.filter((object) => !remoteByUrl.has(getDAVUrlKey(object.url, baseUrl)));
  const deletedUrls = new Set(deleted.map((object) => getDAVUrlKey(object.url, baseUrl)));
  const created = remote.filter((object) => !localByUrl.has(getDAVUrlKey(object.url, baseUrl)));
  const updated: DAVObject[] = [];
  const unchanged: DAVObject[] = [];
  for (const object of local) {
    const key = getDAVUrlKey(object.url, baseUrl);
    if (deletedUrls.has(key)) continue;
    const found = remoteByUrl.get(key);
    if (found && found.etag !== object.etag) updated.push(found);
    else if (found || incremental) unchanged.push(object);
  }
  return { created, updated, deleted, unchanged };
};

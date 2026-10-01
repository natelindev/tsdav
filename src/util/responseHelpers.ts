import { DAVResponse } from '../types/DAVTypes';
import { hasOwn } from './typeHelpers';
import { getDAVUrlKey } from './syncHelpers';

export const assertDAVResponses = (responses: DAVResponse[], context: string): void => {
  const failed = responses.find((response) => !response.ok || response.status >= 400);
  if (failed) throw new Error(`${context}: ${failed.status} ${failed.statusText}`);
};

export const assertDAVDiscovery = (responses: DAVResponse[], context: string): void => {
  assertDAVResponses(responses, context);
  for (const response of responses) {
    if (response.raw?.multistatus && !response.raw.multistatus.response) continue;
    assertDAVProperty(response, 'resourcetype', context);
    if (
      !response.props ||
      !hasOwn(response.props, 'resourcetype') ||
      typeof response.href !== 'string' ||
      !response.href
    ) {
      throw new Error(`${context}: missing resourcetype or href in DAV multistatus response`);
    }
  }
};

export const assertDAVProperty = (response: DAVResponse, name: string, context: string): void => {
  const failed = response.propStats?.find((stat) => !stat.ok && hasOwn(stat.props, name));
  if (failed && !hasOwn(response.props ?? {}, name)) {
    throw new Error(`${context}: ${name} returned ${failed.status} ${failed.statusText}`);
  }
};

export const assertDAVObjectResponses = (
  responses: DAVResponse[],
  property: string,
  objectUrls: string[],
  baseUrl: string,
  context: string,
): void => {
  assertDAVResponses(responses, context);
  const fetchedUrls = new Set<string>();
  for (const response of responses) {
    assertDAVProperty(response, property, context);
    if (
      !response.href ||
      typeof (response.props?.[property]?._cdata ?? response.props?.[property]) !== 'string'
    ) {
      throw new Error(`${context}: missing ${property} or href`);
    }
    fetchedUrls.add(getDAVUrlKey(response.href, baseUrl));
  }
  const withoutQuery = (url: string) => getDAVUrlKey(url.replace(/\?.*$/, ''), baseUrl);
  const countsByPath = new Map<string, number>();
  for (const url of objectUrls) {
    const key = withoutQuery(url);
    countsByPath.set(key, (countsByPath.get(key) ?? 0) + 1);
  }
  // Servers may return a canonical href without the query used in a multiget request.
  if (
    objectUrls.some(
      (url) =>
        !fetchedUrls.has(getDAVUrlKey(url, baseUrl)) &&
        !(countsByPath.get(withoutQuery(url)) === 1 && fetchedUrls.has(withoutQuery(url))),
    )
  ) {
    throw new Error(`${context}: incomplete response`);
  }
};

export const getDAVText = (value: any): string | undefined => {
  const text =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : (value?._cdata ?? value?._text);
  return typeof text === 'string' ? text : undefined;
};

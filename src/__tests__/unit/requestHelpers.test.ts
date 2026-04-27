import { vi, describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import {
  cleanupFalsy,
  conditionalParam,
  excludeHeaders,
  getDAVAttribute,
  urlContains,
  urlEquals,
} from '../../util/requestHelpers';
import { DAVNamespace } from '../../consts';

test('cleanupFalsy should clean undefined from object', () => {
  const objA = {
    test1: 123,
    test2: 'abc',
    test3: undefined,
    test4: undefined,
    test5: null,
    test6: '',
    test7: 0,
    test8: {},
    test9: '0',
  };
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test1')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test2')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test3')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test4')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test5')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test6')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test7')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test8')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test9')).toBe(true);
});

test('urlEquals should handle almost identical urls', () => {
  const url = 'https://www.example.com';
  const url1 = 'https://www.example.com/';
  const url2 = 'https://www.example.com  ';
  const url3 = 'https://www.example.com/  ';
  const url4 = 'www.example.com/';
  const url5 = 'www.example.com';
  const url6 = 'example.com';
  expect(urlEquals('', '')).toBe(true);
  expect(urlEquals('', url1)).toBe(false);
  expect(urlEquals(url, url1)).toBe(true);
  expect(urlEquals(url, url2)).toBe(true);
  expect(urlEquals(url, url3)).toBe(true);
  expect(urlEquals(url, url4)).toBe(false);
  expect(urlEquals(url, url5)).toBe(false);
  expect(urlEquals(url, url6)).toBe(false);
});

test('urlContains should handle almost substring of urls', () => {
  const url = 'https://www.example.com';
  const url1 = 'https://www.example.com/';
  const url2 = 'https://www.example.com  ';
  const url3 = 'https://www.example.com/  ';
  const url4 = 'www.example.com/';
  const url5 = 'www.example.com';
  const url6 = 'example.com';
  const url7 = 'blog.example.com';
  expect(urlContains('', '')).toBe(true);
  expect(urlContains('', url1)).toBe(false);
  expect(urlContains(url, url1)).toBe(true);
  expect(urlContains(url, url2)).toBe(true);
  expect(urlContains(url, url3)).toBe(true);
  expect(urlContains(url, url4)).toBe(true);
  expect(urlContains(url, url5)).toBe(true);
  expect(urlContains(url, url6)).toBe(true);
  expect(urlContains(url, url7)).toBe(false);
});

test('excludeHeaders should exclude headers', () => {
  const headers = {
    test1: '123',
    test2: 'abc',
    test3: 'cde',
  };

  const headersToExclude = ['test1', 'test2'];

  expect(excludeHeaders(headers, headersToExclude)).toEqual({ test3: 'cde' });
});

test('excludeHeaders should handle undefined headers and/or undefined/empty headersToExclude', () => {
  const headers = {
    test1: '123',
    test2: 'abc',
    test3: 'cde',
  };

  const headersToExclude = ['test1', 'test2'];

  expect(excludeHeaders(undefined, headersToExclude)).toEqual({});
  expect(excludeHeaders(headers, undefined)).toEqual(headers);
  expect(excludeHeaders(headers, [])).toEqual(headers);
  expect(excludeHeaders(undefined, undefined)).toEqual({});
  expect(excludeHeaders({}, ['test1', 'test2', 'test3'])).toEqual({});
});

describe('getDAVAttribute', () => {
  it('should return correct attribute for DAV namespace', () => {
    const result = getDAVAttribute([DAVNamespace.DAV]);
    expect(result).toEqual({ 'xmlns:d': DAVNamespace.DAV });
  });

  it('should return correct attributes for multiple namespaces', () => {
    const result = getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV, DAVNamespace.CARDDAV]);
    expect(result).toEqual({
      'xmlns:d': DAVNamespace.DAV,
      'xmlns:c': DAVNamespace.CALDAV,
      'xmlns:card': DAVNamespace.CARDDAV,
    });
  });

  it('should return empty object for empty array', () => {
    const result = getDAVAttribute([]);
    expect(result).toEqual({});
  });

  it('should handle all five namespaces', () => {
    const result = getDAVAttribute([
      DAVNamespace.DAV,
      DAVNamespace.CALDAV,
      DAVNamespace.CARDDAV,
      DAVNamespace.CALENDAR_SERVER,
      DAVNamespace.CALDAV_APPLE,
    ]);
    expect(Object.keys(result)).toHaveLength(5);
    expect(result['xmlns:cs']).toBe(DAVNamespace.CALENDAR_SERVER);
    expect(result['xmlns:ca']).toBe(DAVNamespace.CALDAV_APPLE);
  });
});

describe('conditionalParam', () => {
  it('should return object with key when param is truthy', () => {
    expect(conditionalParam('foo', 'bar')).toEqual({ foo: 'bar' });
    expect(conditionalParam('count', 42)).toEqual({ count: 42 });
    expect(conditionalParam('arr', [1, 2])).toEqual({ arr: [1, 2] });
  });

  it('should return empty object when param is falsy', () => {
    expect(conditionalParam('foo', '')).toEqual({});
    expect(conditionalParam('foo', 0)).toEqual({});
    expect(conditionalParam('foo', null)).toEqual({});
    expect(conditionalParam('foo', undefined)).toEqual({});
    expect(conditionalParam('foo', false)).toEqual({});
  });
});

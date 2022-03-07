import { cleanupFalsy, urlContains, urlEquals } from '../../util/requestHelpers';

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

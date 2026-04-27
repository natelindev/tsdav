import { describe, it, test, expect } from 'vitest';
import { camelCase } from '../camelCase';

describe('camelCase', () => {
  it('should convert hyphen-separated to camelCase', () => {
    expect(camelCase('foo-bar')).toBe('fooBar');
    expect(camelCase('foo-bar-baz')).toBe('fooBarBaz');
  });

  it('should convert underscore-separated to camelCase', () => {
    expect(camelCase('foo_bar')).toBe('fooBar');
    expect(camelCase('foo_bar_baz')).toBe('fooBarBaz');
  });

  it('should handle mixed separators', () => {
    expect(camelCase('foo-bar_baz')).toBe('fooBarBaz');
  });

  it('should return same string when already camelCase', () => {
    expect(camelCase('fooBar')).toBe('fooBar');
  });

  it('should return empty string for empty input', () => {
    expect(camelCase('')).toBe('');
  });

  it('should handle single word', () => {
    expect(camelCase('foo')).toBe('foo');
  });

  it('should handle strings with numbers', () => {
    expect(camelCase('foo-1bar')).toBe('foo1bar');
  });
});

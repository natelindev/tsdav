import { describe, it, test, expect } from 'vitest';
import { nativeType } from '../nativeType';

describe('nativeType', () => {
  it('should convert numeric strings to numbers', () => {
    expect(nativeType('42')).toBe(42);
    expect(nativeType('3.14')).toBe(3.14);
    expect(nativeType('0')).toBe(0);
    expect(nativeType('-5')).toBe(-5);
  });

  it('should convert "true" to boolean true (case-insensitive)', () => {
    expect(nativeType('true')).toBe(true);
    expect(nativeType('True')).toBe(true);
    expect(nativeType('TRUE')).toBe(true);
  });

  it('should convert "false" to boolean false (case-insensitive)', () => {
    expect(nativeType('false')).toBe(false);
    expect(nativeType('False')).toBe(false);
    expect(nativeType('FALSE')).toBe(false);
  });

  it('should return string as-is for non-numeric non-boolean strings', () => {
    expect(nativeType('hello')).toBe('hello');
    expect(nativeType('foo bar')).toBe('foo bar');
  });

  it('should return empty string as-is (not coerced to 0)', () => {
    expect(nativeType('')).toBe('');
  });

  it('should return whitespace as string (not coerced to 0)', () => {
    expect(nativeType('  ')).toBe('  ');
  });

  it('should preserve numeric-looking tokens with leading zeros', () => {
    // sync tokens / ctags like "0123" must not be silently coerced to 123
    expect(nativeType('0123')).toBe('0123');
    expect(nativeType('007')).toBe('007');
  });

  it('should preserve etag-like quoted strings', () => {
    expect(nativeType('"abc123"')).toBe('"abc123"');
  });

  it('should preserve sync-token URIs', () => {
    expect(nativeType('http://sabre.io/ns/sync/123')).toBe('http://sabre.io/ns/sync/123');
  });
});

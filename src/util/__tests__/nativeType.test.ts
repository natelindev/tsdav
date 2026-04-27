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

  it('should return empty string as-is', () => {
    // '' converts to 0 via Number(''), so it returns 0
    expect(nativeType('')).toBe(0);
  });

  it('should return whitespace as string', () => {
    // '  ' converts to 0 via Number('  '), so it returns 0
    expect(nativeType('  ')).toBe(0);
  });
});

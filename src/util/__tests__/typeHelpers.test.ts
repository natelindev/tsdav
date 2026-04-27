import { describe, it, test, expect } from 'vitest';
import { hasFields, findMissingFieldNames } from '../typeHelpers';

describe('hasFields', () => {
  it('should return true when all fields are present and truthy', () => {
    const obj = { a: 'val', b: 42, c: true };
    expect(hasFields(obj, ['a', 'b'])).toBe(true);
  });

  it('should return false when a field is missing or falsy', () => {
    const obj = { a: 'val', b: undefined, c: '' };
    expect(hasFields(obj as any, ['a', 'b'])).toBe(false);
    expect(hasFields(obj as any, ['a', 'c'])).toBe(false);
  });

  it('should work with arrays of objects', () => {
    const arr = [
      { a: 'x', b: 1 },
      { a: 'y', b: 2 },
    ];
    expect(hasFields(arr, ['a', 'b'])).toBe(true);

    const arr2 = [
      { a: 'x', b: 1 },
      { a: undefined, b: 2 },
    ];
    expect(hasFields(arr2 as any, ['a', 'b'])).toBe(false);
  });

  it('should return true when fields array is empty', () => {
    expect(hasFields({ a: 1 }, [])).toBe(true);
    expect(hasFields([{ a: 1 }], [])).toBe(true);
  });
});

describe('findMissingFieldNames', () => {
  it('should return empty string when all fields present', () => {
    expect(findMissingFieldNames({ a: 'val', b: 42 }, ['a', 'b'])).toBe('');
  });

  it('should return comma-separated missing field names', () => {
    expect(findMissingFieldNames({ a: 'val', b: undefined, c: undefined } as any, ['a', 'b', 'c'])).toBe('b,c');
  });

  it('should treat falsy values as missing', () => {
    expect(findMissingFieldNames({ a: '', b: 0, c: null } as any, ['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('should return empty for empty fields array', () => {
    expect(findMissingFieldNames({ a: 1 }, [])).toBe('');
  });
});

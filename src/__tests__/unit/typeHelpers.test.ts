import { findMissingFieldNames, hasFields } from '../../util/typeHelpers';

test('hasFields should detect missing fields', () => {
  const obj = {
    test1: 123,
    test2: 'abc',
  };
  const arr = ['a', 'b', 'c'];
  expect(hasFields(obj, ['test1'])).toBe(true);
  expect(hasFields(obj, ['test2'])).toBe(true);
  // @ts-expect-error need to ignore the ts error
  expect(hasFields(obj, ['test3'])).toBe(false);
  // @ts-expect-error need to ignore the ts error
  expect(hasFields(obj, [0])).toBe(false);
  expect(hasFields(arr, ['length'])).toBe(true);
});

test('findMissingFieldNames should find missing fields', () => {
  type ObjType = {
    test1?: number;
    test2?: string;
    test3?: string;
  };
  const obj: ObjType = {
    test1: 123,
    test2: 'abc',
    test3: 'cde',
  };
  const obj1: ObjType = {
    test2: 'abc',
  };
  const obj2: ObjType = {
    test3: 'abc',
  };
  expect(findMissingFieldNames(obj, ['test1', 'test2', 'test3'])).toEqual('');
  expect(findMissingFieldNames(obj1, ['test1', 'test2', 'test3'])).toEqual('test1,test3');
  expect(findMissingFieldNames(obj2, ['test1', 'test2', 'test3'])).toEqual('test1,test2');
  expect(findMissingFieldNames(obj1, ['test2', 'test3'])).toEqual('test3');
});

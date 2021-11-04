import { nativeType } from '../../util/nativeType';

test('nativeType should be able to handle numbers', () => {
  const a = nativeType('123');
  const b = nativeType('1.2');
  const c = nativeType('9999999999');
  const d = nativeType('-123');
  expect(typeof a).toEqual('number');
  expect(typeof b).toEqual('number');
  expect(typeof c).toEqual('number');
  expect(typeof d).toEqual('number');
});

test('nativeType should be able to handle booleans', () => {
  const a = nativeType('true');
  const b = nativeType('false');
  const c = nativeType('TRUE');
  const d = nativeType('FALSE');
  expect(typeof a).toEqual('boolean');
  expect(typeof b).toEqual('boolean');
  expect(typeof c).toEqual('boolean');
  expect(typeof d).toEqual('boolean');
});

test('nativeType should keep other types as string', () => {
  const a = nativeType('{}');
  const b = nativeType('test');
  const c = nativeType('{ a: b}');
  const d = nativeType('NaN');
  expect(typeof a).toEqual('string');
  expect(typeof b).toEqual('string');
  expect(typeof c).toEqual('string');
  expect(typeof d).toEqual('string');
});

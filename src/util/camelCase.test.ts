import { camelCase } from './camelCase';

test('camelCase should convert snakeCase to camelCase', () => {
  const snakeString1 = 'snake-name';
  const snakeString2 = 'snake-Name';
  const snakeString3 = 'snake_Name';
  const snakeString4 = 'snake_name';

  expect(camelCase(snakeString1)).toEqual('snakeName');
  expect(camelCase(snakeString2)).toEqual('snakeName');
  expect(camelCase(snakeString3)).toEqual('snakeName');
  expect(camelCase(snakeString4)).toEqual('snakeName');
});

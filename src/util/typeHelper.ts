export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };
export type Await<T> = T extends PromiseLike<infer U> ? U : T;
export type RequiredAndNotNull<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>;
};
export type RequireAndNotNullSome<T, K extends keyof T> = RequiredAndNotNull<Pick<T, K>> &
  Omit<T, K>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export function hasFields<T, K extends keyof T>(
  obj: Array<T | RequireAndNotNullSome<T, K>>,
  fields: K[]
): obj is Array<RequireAndNotNullSome<T, K>>;
export function hasFields<T, K extends keyof T>(
  obj: T | RequireAndNotNullSome<T, K>,
  fields: K[]
): obj is RequireAndNotNullSome<T, K>;
export function hasFields<T, K extends keyof T>(obj: T | Array<T>, fields: K[]): boolean {
  const inObj: { (obj: T | RequireAndNotNullSome<T, K>): boolean } = (object) =>
    fields.every((f) => object[f]);

  if (Array.isArray(obj)) {
    return obj.every((o) => inObj(o));
  }
  return inObj(obj);
}

export const findMissingFieldNames = <T>(obj: T, fields: Array<keyof T>): string =>
  fields.reduce((prev, curr) => (obj[curr] ? prev : `${prev.length ? `${prev},` : ''}${curr}`), '');

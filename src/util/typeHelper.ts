export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };

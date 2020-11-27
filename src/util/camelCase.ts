export const camelCase = (str: string): string =>
  str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

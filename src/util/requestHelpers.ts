import { DAVAttributeMap, DAVNamespace } from '../consts';

import type { NoUndefinedField } from './typeHelpers';

export const urlEquals = (urlA?: string, urlB?: string): boolean => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }

  const trimmedUrlA = urlA.trim();
  const trimmedUrlB = urlB.trim();

  if (Math.abs(trimmedUrlA.length - trimmedUrlB.length) > 1) {
    return false;
  }

  const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
  const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
  return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};

export const urlContains = (urlA?: string, urlB?: string): boolean => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }

  const trimmedUrlA = urlA.trim();
  const trimmedUrlB = urlB.trim();

  const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
  const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
  return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};

export const getDAVAttribute = (nsArr: DAVNamespace[]): { [key: string]: DAVNamespace } =>
  nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});

export const cleanupFalsy = <T = unknown>(obj: T): NoUndefinedField<T> =>
  Object.entries(obj).reduce((prev, [key, value]) => {
    if (value) return { ...prev, [key]: value };
    return prev;
  }, {} as NoUndefinedField<T>);

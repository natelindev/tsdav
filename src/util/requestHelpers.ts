import { DAVFilter, DAVProp } from 'DAVTypes';

import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from '../consts';

import type { NoUndefinedField } from './typeHelper';

export const urlEquals = (urlA?: string, urlB?: string): boolean => {
  if (!urlA || !urlB) {
    return false;
  }
  const trimmedUrlA = urlA.trim();
  const trimmedUrlB = urlB.trim();
  const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
  const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
  return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};

// merge two objects, same key property become array
export const mergeObjectDupKeyArray = <T, U>(
  objA: T,
  ObjB: U
): { [key in keyof T & keyof U]: any } =>
  (Object.entries(objA) as Array<[keyof T, any]>).reduce((merged: T & U, [currKey, currValue]): T &
    U => {
    if (merged[currKey] && Array.isArray(merged[currKey])) {
      // is array
      return {
        ...merged,
        [currKey]: [...((merged[currKey] as unknown) as unknown[]), currValue],
      };
    }
    if (merged[currKey] && !Array.isArray(merged[currKey])) {
      // not array
      return { ...merged, [currKey]: [merged[currKey], currValue] };
    }
    // not exist
    return { ...merged, [currKey]: currValue };
  }, ObjB);

export const getDAVAttribute = (nsArr: DAVNamespace[]): { [key: string]: DAVNamespace } =>
  nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});

export const formatProps = (props?: DAVProp[]): { [key: string]: any } | undefined =>
  props?.reduce((prev, curr) => {
    if (curr.namespace) {
      return {
        ...prev,
        [`${DAVNamespaceShorthandMap[curr.namespace]}:${curr.name}`]: curr.value ?? {},
      };
    }
    return { ...prev, [`${curr.name}`]: curr.value ?? {} };
  }, {});

export const formatFilters = (filters?: DAVFilter[]): { [key: string]: any } | undefined =>
  filters?.map((f) => ({
    [f.type]: {
      _attributes: f.attributes,
      ...(f.children ? formatFilters(f.children) : [])?.reduce(
        (prev: any, curr: any) => mergeObjectDupKeyArray(prev, curr),
        {} as any
      ),
      _text: f.value ?? '',
    },
  }));

export const cleanupUndefined = <T = unknown>(obj: T): NoUndefinedField<T> =>
  Object.entries(obj).reduce((prev, [key, value]) => {
    if (value) return { ...prev, [key]: value };
    return prev;
  }, {} as NoUndefinedField<T>);

import convert from 'xml-js';

import { DAVNamespace } from '../../../src/consts';
import { parseDAVXML } from '../../../src/util/xml';

export const DAVNamespaceShorthandMap = {
  [DAVNamespace.CALDAV]: 'c',
  [DAVNamespace.CARDDAV]: 'card',
  [DAVNamespace.CALENDAR_SERVER]: 'cs',
  [DAVNamespace.CALDAV_APPLE]: 'ca',
  [DAVNamespace.DAV]: 'd',
};

export type DAVProp = {
  name: string;
  namespace?: DAVNamespace;
  value?: string | number;
};

export type DAVFilter = {
  type: string;
  attributes: Record<string, string>;
  value?: string | number;
  children?: DAVFilter[];
};

// merge two objects, same key property become array
type ShallowMergeDupKeyArray<A, B> = {
  [key in keyof A | keyof B]: key extends keyof A & keyof B
    ? Array<A[key] | B[key]>
    : key extends keyof A
      ? A[key]
      : key extends keyof B
        ? B[key]
        : never;
};
export const mergeObjectDupKeyArray = <
  A extends Record<string, any>,
  B extends Record<string, any>,
>(
  objA: A,
  objB: B,
): ShallowMergeDupKeyArray<A, B> => {
  const merged: Record<string, any> = { ...objA };
  for (const [currKey, currValue] of Object.entries(objB)) {
    if (Object.prototype.hasOwnProperty.call(merged, currKey)) {
      const existing = merged[currKey];
      const nextValues = Array.isArray(currValue) ? currValue : [currValue];
      merged[currKey] = Array.isArray(existing)
        ? [...existing, ...nextValues]
        : [existing, ...nextValues];
    } else {
      merged[currKey] = currValue;
    }
  }
  return merged as ShallowMergeDupKeyArray<A, B>;
};

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

export const formatFilters = (
  filters?: DAVFilter[],
): Array<{ [key: string]: any }> | undefined =>
  filters?.map((f) => ({
    [f.type]: {
      _attributes: f.attributes,
      ...(f.children ? formatFilters(f.children) : [])?.reduce(
        (prev: any, curr: any) => mergeObjectDupKeyArray(prev, curr),
        {} as any,
      ),
      _text: f.value ?? undefined,
    },
  }));

export const xml2js = parseDAVXML;

export const convertInput = (
  variant: 'prop' | 'filter' | 'xml' | 'xml-reverse',
  input: string,
): string => {
  if (variant === 'xml') return JSON.stringify(xml2js(input), null, 2);
  const value = JSON.parse(input);
  if (variant === 'xml-reverse') return js2xml(value);
  if (!Array.isArray(value)) throw new Error('Enter a JSON array.');
  return JSON.stringify(variant === 'prop' ? formatProps(value) : formatFilters(value), null, 2);
};

export const js2xml = (obj: any) =>
  convert.js2xml(
    {
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
      ...obj,
    },
    {
      compact: true,
      spaces: 2,
    },
  );

import { DAVFilter, DAVProp } from 'DAVTypes';

import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from '../consts';

export const urlEquals = (urlA: string, urlB: string): boolean => {
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

export const formatProps = (props: DAVProp[]): { [key: string]: any } =>
  props.reduce(
    (prev, curr) => ({ ...prev, [`${DAVNamespaceShorthandMap[curr.namespace]}:${curr.name}`]: {} }),
    {}
  );

export const formatFilters = (filters: DAVFilter[]): { [key: string]: any } =>
  filters.map((f) => ({
    _attributes: f.attributes,
    [f.type]: f.children ? formatFilters(f.children) : f.value,
  }));

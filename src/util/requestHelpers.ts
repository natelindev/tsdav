import { DAVFilter, DAVProp } from 'DAVTypes';

import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from '../consts';

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

export const getDAVAttribute = (nsArr: DAVNamespace[]): { [key: string]: DAVNamespace } =>
  nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});

export const formatProps = (props?: DAVProp[]): { [key: string]: any } | undefined =>
  props?.reduce((prev, curr) => {
    if (curr.namespace) {
      return { ...prev, [`${DAVNamespaceShorthandMap[curr.namespace]}:${curr.name}`]: {} };
    }
    return { ...prev, [`${curr.name}`]: {} };
  }, {});

// TODO: Fix formatFilters
export const formatFilters = (filters?: DAVFilter[]): { [key: string]: any } | undefined =>
  filters?.map((f) => ({
    [f.type]: {
      _attributes: f.attributes,
      ...(f.children ? formatFilters(f.children) : { _text: f.value }),
    },
  }));

import { DAVFilter, DAVProp } from 'requestTypes';

import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from '../consts';

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

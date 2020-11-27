import { DAVFilter, DAVProp } from 'requestTypes';

import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from '../consts';
import { camelCase } from './camelCase';

export const getDAVAttribute = (nsArr: DAVNamespace[]): { [key: string]: DAVNamespace } =>
  nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});

export const formatProps = (props: DAVProp[]): { [key: string]: any } =>
  props.map((p) => ({
    [`${DAVNamespaceShorthandMap[p.namespace]}:${p.name}`]: {},
  }));

export const formatFilters = (filters: DAVFilter[]): { [key: string]: any } =>
  filters.map((f) => ({
    _attributes: f.attributes,
    [f.type]: f.children ? formatFilters(f.children) : f.value,
  }));

export const formatResponseProp = (prop: any): any =>
  Object.entries(prop).reduce((prev, curr) => ({ ...prev, [camelCase(curr[0])]: curr[1] }), {});

import { DAVFilter, DAVProp } from 'requestTypes';
import { DAVNamespaceShorthandMap, DAVAttributeMap, DAVNamespace } from '../consts';

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

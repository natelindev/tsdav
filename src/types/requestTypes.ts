import { DAVNamespace } from '../consts';

export type DAVProp = {
  name: string;
  namespace?: DAVNamespace;
};

export type DAVFilter = {
  type: 'comp-filter' | 'prop-filter' | 'param-filter';
  attributes: { [key: string]: string };
  value?: string | number;
  children?: DAVFilter[];
};

export type DAVDepth = '0' | '1' | 'infinity';

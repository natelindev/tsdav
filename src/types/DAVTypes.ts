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

export type DAVMethods =
  | 'COPY'
  | 'LOCK'
  | 'MKCOL'
  | 'MOVE'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'UNLOCK'
  | 'REPORT'
  | 'SEARCH';

export type HTTPMethods =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';

export type DAVResponse = {
  href?: string;
  status: number;
  statusText: string;
  ok: boolean;
  error?: { [key: string]: any };
  responsedescription?: string;
  props?: { [key: string]: { status: number; statusText: string; ok: boolean; value: any } | any };
};

export type DAVRequest = {
  headers?: { [key: string]: any };
  method: DAVMethods | HTTPMethods;
  body: any;
  namespace?: string;
  attributes?: { [key: string]: any };
};

export type DAVTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export type DAVAuthHeaders = {
  authorization?: string;
};

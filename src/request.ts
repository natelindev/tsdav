import convert from 'xml-js';
import { fetch } from 'cross-fetch';
import getLogger from 'debug';
import type { DAVNamespace, DAVMethod } from './consts';
import { nativeType } from './util/nativeType';

const debug = getLogger('tsdav:request');

type RawResponse = {
  href: string;
  status: string;
  ok: boolean;
  error: { [key: string]: any };
  responsedescription: string;
  propstat: { prop: { [key: string]: any }; status: string }[];
};

type DAVResponse = {
  href?: string;
  status: number;
  statusText: string;
  ok: boolean;
  error?: { [key: string]: any };
  responsedescription?: string;
  propstat?: { [key: string]: { status: number; statusText: string; ok: boolean } };
};

export async function davRequest(
  url: string,
  options: {
    headers?: { [key: string]: any };
    method: DAVMethod;
    body: any;
    namespace?: DAVNamespace;
    attributes?: { [key: string]: any };
  }
): Promise<DAVResponse> {
  const { headers, body, namespace, method, attributes } = options;
  const xmlBody = convert.js2xml(
    { ...body, _attributes: attributes },
    {
      compact: true,
      spaces: 2,
      elementNameFn: (name) => {
        // add namespace to all keys without namespace
        if (namespace && !/^.+:.+/.test(name)) {
          return `${namespace}:${name}`;
        }
        return name;
      },
    }
  );

  const davResponse = await fetch(url, {
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', ...headers },
    body: xmlBody,
    method,
  });

  const resText = await davResponse.text();

  // filter out invalid responses
  debug(resText);
  if (!davResponse.ok || !davResponse.headers.get('content-type').includes('xml')) {
    return {
      href: davResponse.url,
      ok: davResponse.ok,
      status: davResponse.status,
      statusText: davResponse.statusText,
      responsedescription: resText,
    };
  }

  const result: any = convert.xml2js(resText, {
    compact: true,
    trim: true,
    textFn: (value: any, parentElement: any) => {
      try {
        // This is needed for xml-js design reasons
        // eslint-disable-next-line no-underscore-dangle
        const parentOfParent = parentElement._parent;
        const pOpKeys = Object.keys(parentOfParent);
        const keyNo = pOpKeys.length;
        const keyName = pOpKeys[keyNo - 1];
        const arrOfKey = parentOfParent[keyName];
        const arrOfKeyLen = arrOfKey.length;
        if (arrOfKeyLen > 0) {
          const arr = arrOfKey;
          const arrIndex = arrOfKey.length - 1;
          arr[arrIndex] = nativeType(value);
        } else {
          parentOfParent[keyName] = nativeType(value);
        }
      } catch (e) {
        debug(e.stack);
      }
    },
    // remove namespace
    elementNameFn: (attributeName) => attributeName.replace(/^.+:/, ''),
    ignoreAttributes: true,
    ignoreDeclaration: true,
  });

  const responseBody: RawResponse = result.multistatus.response;
  const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
  const matchArr = statusRegex.exec(responseBody.status);

  return {
    href: responseBody.href,
    status: matchArr ? Number.parseInt(matchArr?.groups.status, 10) : davResponse.status,
    statusText: matchArr?.groups.statusText ?? davResponse.statusText,
    ok: !responseBody.error,
    error: responseBody.error,
    responsedescription: responseBody.responsedescription,
    propstat: responseBody.propstat?.reduce((prev, curr) => {
      const innerMatchArr = statusRegex.exec(curr.status);
      const statusCode = Number.parseInt(innerMatchArr?.groups.status, 10);
      return {
        ...prev,
        [Object.keys(curr.prop)[0]]: {
          status: statusCode,
          ok: statusCode >= 200 && statusCode < 400,
          statusText: innerMatchArr && innerMatchArr.groups.statusText,
        },
      };
    }, {}),
  };
}

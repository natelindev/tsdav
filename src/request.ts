import type { DAVNamespace, DAVMethod } from './consts';
import convert from 'xml-js';
import { fetch } from 'cross-fetch';
import { nativeType } from './util/nativeType';

export async function davRequest(
  url: string,
  options: {
    headers: any;
    method: DAVMethod;
    body: any;
    namespace: DAVNamespace;
    attributes: { [key: string]: string };
  }
) {
  const { headers, body, namespace, method, attributes } = options;
  const xmlBody = convert.js2xml(body, {
    compact: true,
    spaces: 2,
    elementNameFn: (name) => {
      // add namespace to all keys without namespace
      if (namespace && !/^.+:.+/.test(name)) {
        return `${namespace}:${name}`;
      }
      return name;
    },
  });

  const davResponse = await fetch(url, {
    headers: { 'Content-Type': 'text/xml;charset=UTF-8', ...headers },
    body: xmlBody,
    method,
  });

  const result = convert.xml2js(await davResponse.text(), {
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
        console.error(e);
      }
    },
    // remove namespace
    elementNameFn: (attributeName) => attributeName.replace(/^.+:/, ''),
    ignoreAttributes: true,
    ignoreDeclaration: true,
  });

  return result;
}

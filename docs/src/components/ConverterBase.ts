import convert from 'xml-js';

export const DAVNamespaceString = `const DAVNamespace = {
  CALENDAR_SERVER:'http://calendarserver.org/ns/',
  CALDAV_APPLE:'http://apple.com/ns/ical/',
  CALDAV:'urn:ietf:params:xml:ns:caldav',
  CARDDAV:'urn:ietf:params:xml:ns:carddav',
  DAV:'DAV:',
};
`;

export enum DAVNamespace {
  CALENDAR_SERVER = 'http://calendarserver.org/ns/',
  CALDAV_APPLE = 'http://apple.com/ns/ical/',
  CALDAV = 'urn:ietf:params:xml:ns:caldav',
  CARDDAV = 'urn:ietf:params:xml:ns:carddav',
  DAV = 'DAV:',
}

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
export const mergeObjectDupKeyArray = <A, B>(objA: A, objB: B): ShallowMergeDupKeyArray<A, B> => {
  return (Object.entries(objA) as Array<[keyof A | keyof B, unknown]>).reduce(
    (
      merged: ShallowMergeDupKeyArray<A, B>,
      [currKey, currValue]
    ): ShallowMergeDupKeyArray<A, B> => {
      if (merged[currKey] && Array.isArray(merged[currKey])) {
        // is array
        return {
          ...merged,
          [currKey]: [...(merged[currKey] as unknown as unknown[]), currValue],
        };
      }
      if (merged[currKey] && !Array.isArray(merged[currKey])) {
        // not array
        return { ...merged, [currKey]: [merged[currKey], currValue] };
      }
      // not exist
      return { ...merged, [currKey]: currValue };
    },
    objB as ShallowMergeDupKeyArray<A, B>
  );
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

export const formatFilters = (filters?: DAVFilter[]): { [key: string]: any } | undefined =>
  filters?.map((f) => ({
    [f.type]: {
      _attributes: f.attributes,
      ...(f.children ? formatFilters(f.children) : [])?.reduce(
        (prev: any, curr: any) => mergeObjectDupKeyArray(prev, curr),
        {} as any
      ),
      _text: f.value ?? undefined,
    },
  }));

export const safeGuard = (f: () => any): any => {
  try {
    return f();
  } catch (err) {
    // do nothing
    return err.stack;
  }
};

export const nativeType = (value: string): unknown => {
  const nValue = Number(value);
  if (!Number.isNaN(nValue)) {
    return nValue;
  }
  const bValue = value.toLowerCase();
  if (bValue === 'true') {
    return true;
  }
  if (bValue === 'false') {
    return false;
  }
  return value;
};

export const camelCase = (str: string): string =>
  str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

export const xml2js = (xml: string) =>
  convert.xml2js(xml, {
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
        console.log((e as Error).stack);
      }
    },
    // remove namespace & camelCase
    elementNameFn: (attributeName) => camelCase(attributeName.replace(/^.+:/, '')),
    attributesFn: (value: any) => {
      const newVal = { ...value };
      delete newVal.xmlns;
      return newVal;
    },
    ignoreDeclaration: true,
  });

export const js2xml = (obj: any) =>
  convert.js2xml(
    {
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
      ...obj,
    },
    {
      compact: true,
      spaces: 2,
    }
  );

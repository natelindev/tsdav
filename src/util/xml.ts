import convert, { Element, ElementCompact } from 'xml-js';

import { DAVNamespace } from '../consts';
import { DAVPropStat } from '../types/DAVTypes';
import { camelCase } from './camelCase';
import { hasOwn } from './typeHelpers';

type NormalizedElement = {
  value: any;
  namespace: string;
  namespaces: Record<string, string>;
};

const davNamespaces = new Set<string>(Object.values(DAVNamespace));

const standardNamespaces = new Map<string, string>([
  ...[
    'multistatus',
    'response',
    'propstat',
    'prop',
    'href',
    'status',
    'error',
    'responsedescription',
    'resourcetype',
    'collection',
    'getetag',
    'displayname',
    'syncToken',
    'supportedReportSet',
    'supportedReport',
    'report',
    'currentUserPrincipal',
  ].map((name): [string, string] => [name, DAVNamespace.DAV]),
  ...[
    'calendarData',
    'calendar',
    'calendarDescription',
    'calendarTimezone',
    'calendarHomeSet',
    'calendarUserAddressSet',
    'supportedCalendarComponentSet',
    'comp',
  ].map((name): [string, string] => [name, DAVNamespace.CALDAV]),
  ...['addressData', 'addressbook', 'addressbookHomeSet'].map((name): [string, string] => [
    name,
    DAVNamespace.CARDDAV,
  ]),
  ['getctag', DAVNamespace.CALENDAR_SERVER],
  ['calendarColor', DAVNamespace.CALDAV_APPLE],
]);

const normalizedKey = (name: string, namespace: string): string => {
  const localName = camelCase(name.replace(/^.*:/, ''));
  const standardNamespace = standardNamespaces.get(localName);
  return namespace && standardNamespace && namespace !== standardNamespace
    ? `{${namespace}}${localName}`
    : localName;
};

const normalizeElement = (
  element: Element,
  inheritedNamespaces: Record<string, string>,
): NormalizedElement => {
  const namespaceContext = Object.assign(Object.create(null), inheritedNamespaces);
  const attributes: Record<string, unknown> = Object.create(null);
  for (const [name, value] of Object.entries(element.attributes ?? {})) {
    if (name === 'xmlns' || name.startsWith('xmlns:')) {
      namespaceContext[name === 'xmlns' ? '' : name.slice(6)] = String(value);
    }
    if (name !== 'xmlns') attributes[name] = value;
  }

  const name = element.name ?? '';
  const separator = name.indexOf(':');
  const namespace = namespaceContext[separator === -1 ? '' : name.slice(0, separator)] ?? '';
  const children = element.elements ?? [];
  const elements = children.filter((child) => child.type === 'element');
  const text = children
    .filter((child) => child.type === 'text' || child.type === 'cdata')
    .map((child) => String(child.text ?? child.cdata ?? ''))
    .join('');
  const value: Record<string, any> = {};
  const namespaces: Record<string, string> = Object.create(null);
  if (Object.keys(attributes).length) value._attributes = attributes;

  if (!elements.length) {
    const hasText = children.some((child) => child.type === 'text');
    const hasCdata = children.some((child) => child.type === 'cdata');
    if (hasText) return { value: text, namespace, namespaces };
    if (hasCdata) value._cdata = text;
    return { value, namespace, namespaces };
  }

  if (text.trim()) value._text = text;

  for (const child of elements) {
    const normalized = normalizeElement(child, namespaceContext);
    const localName = camelCase((child.name ?? '').replace(/^.*:/, ''));
    let key = normalizedKey(child.name ?? '', normalized.namespace);
    const previousNamespace = namespaces[key];
    if (hasOwn(value, key) && previousNamespace !== normalized.namespace) {
      if (davNamespaces.has(normalized.namespace) && !davNamespaces.has(previousNamespace)) {
        const previousKey = `{${previousNamespace}}${localName}`;
        Object.defineProperty(value, previousKey, {
          value: value[key],
          enumerable: true,
          configurable: true,
          writable: true,
        });
        namespaces[previousKey] = previousNamespace;
        delete value[key];
      } else {
        key = `{${normalized.namespace}}${localName}`;
      }
    }
    if (hasOwn(value, key)) {
      if (Array.isArray(value[key])) value[key].push(normalized.value);
      else value[key] = [value[key], normalized.value];
    } else {
      Object.defineProperty(value, key, {
        value: normalized.value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    namespaces[key] = normalized.namespace;
    if (localName === 'prop' && normalized.namespace === DAVNamespace.DAV) {
      value.propNamespaces = normalized.namespaces;
    }
  }
  return { value, namespace, namespaces };
};

/** Preserve XML text order before normalizing DAV names to the existing compact shape. */
export const parseDAVXML = (xml: string): ElementCompact => {
  const document = convert.xml2js(xml, { compact: false, ignoreDeclaration: true }) as Element;
  const result: ElementCompact = {};
  for (const element of document.elements ?? []) {
    if (element.type !== 'element') continue;
    const normalized = normalizeElement(element, {});
    const key = normalizedKey(element.name ?? '', normalized.namespace);
    Object.defineProperty(result, key, {
      value: normalized.value,
      enumerable: true,
    });
  }
  return result;
};

/** Keep same-name properties from distinct namespaces across propstat groups. */
export const mergeDAVProps = (propStats: DAVPropStat[]): Record<string, any> => {
  const groups = new Map<string, Map<string, any>>();
  for (const stat of propStats) {
    if (!stat.ok) continue;
    for (const [name, value] of Object.entries(stat.props)) {
      const namespaces = groups.get(name) ?? new Map<string, any>();
      namespaces.set(stat.namespaces?.[name] ?? '', value);
      groups.set(name, namespaces);
    }
  }
  const props: Record<string, any> = {};
  for (const [name, namespaces] of groups) {
    const primary =
      [...namespaces.keys()].find((namespace) => davNamespaces.has(namespace)) ??
      namespaces.keys().next().value;
    for (const [namespace, value] of namespaces) {
      Object.defineProperty(props, namespace === primary ? name : `{${namespace}}${name}`, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
  }
  return props;
};

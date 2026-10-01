import { ElementCompact } from 'xml-js';
import { DAVPropStat } from '../types/DAVTypes';
/** Preserve XML text order before normalizing DAV names to the existing compact shape. */
export declare const parseDAVXML: (xml: string) => ElementCompact;
/** Keep same-name properties from distinct namespaces across propstat groups. */
export declare const mergeDAVProps: (propStats: DAVPropStat[]) => Record<string, any>;

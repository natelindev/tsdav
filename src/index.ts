import * as account from './account';
import * as addressBook from './addressBook';
import * as calendar from './calendar';
import * as client from './client';
import * as collection from './collection';
import { DAVAttributeMap, DAVNamespace, DAVNamespaceShort, ICALObjects } from './consts';
import * as request from './request';
import * as authHelpers from './util/authHelpers';
import * as requestHelpers from './util/requestHelpers';

export type { DAVDepth, DAVMethods, DAVRequest, DAVResponse, DAVTokens } from './types/DAVTypes';
export type {
  DAVAccount,
  DAVAddressBook,
  DAVCalendar,
  DAVCalendarObject,
  DAVCollection,
  DAVCredentials,
  DAVObject,
  DAVVCard,
} from './types/models';
export type {
  SmartCollectionSync,
  SmartCollectionSyncDetailed,
  SmartCollectionSyncDetailedResult,
  SyncCalendars,
  SyncCalendarsDetailed,
  SyncCalendarsDetailedResult,
} from './types/functionsOverloads';

export { DAVClient } from './client';

export { createDAVClient } from './client';
export {
  createAccount,
  serviceDiscovery,
  fetchPrincipalUrl,
  fetchHomeUrl,
} from './account';
export { davRequest, propfind, createObject, updateObject, deleteObject } from './request';

export {
  collectionQuery,
  supportedReportSet,
  isCollectionDirty,
  syncCollection,
  smartCollectionSync,
  smartCollectionSyncDetailed,
} from './collection';

export {
  calendarQuery,
  calendarMultiGet,
  makeCalendar,
  fetchCalendars,
  fetchCalendarUserAddresses,
  fetchCalendarObjects,
  createCalendarObject,
  updateCalendarObject,
  deleteCalendarObject,
  syncCalendars,
  syncCalendarsDetailed,
  freeBusyQuery,
} from './calendar';

export {
  addressBookQuery,
  addressBookMultiGet,
  fetchAddressBooks,
  fetchVCards,
  createVCard,
  updateVCard,
  deleteVCard,
} from './addressBook';

export {
  getBasicAuthHeaders,
  getBearerAuthHeaders,
  getOauthHeaders,
  fetchOauthTokens,
  refreshAccessToken,
} from './util/authHelpers';
export {
  urlContains,
  urlEquals,
  urlMatches,
  ensureTrailingSlash,
  getDAVAttribute,
  cleanupFalsy,
  excludeHeaders,
  mergeHeaders,
} from './util/requestHelpers';
export { DAVNamespace, DAVAttributeMap, DAVNamespaceShort, ICALObjects } from './consts';
export default {
  DAVNamespace,
  DAVNamespaceShort,
  DAVAttributeMap,
  ICALObjects,
  ...client,
  ...request,
  ...collection,
  ...account,
  ...addressBook,
  ...calendar,
  ...authHelpers,
  ...requestHelpers,
};

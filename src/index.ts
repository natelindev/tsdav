import * as account from './account';
import * as addressBook from './addressBook';
import * as calendar from './calendar';
import * as client from './client';
import * as collection from './collection';
import { DAVAttributeMap, DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import * as request from './request';
import * as authHelper from './util/authHelper';

export type {
  DAVProp,
  DAVFilter,
  DAVDepth,
  DAVMethods,
  DAVRequest,
  DAVResponse,
  DAVTokens,
} from './types/DAVTypes';
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

export type { DAVClient } from './client';

export { createDAVClient } from './client';
export { createAccount } from './account';
export { davRequest, propfind, createObject, updateObject, deleteObject } from './request';
export {
  collectionQuery,
  supportedReportSet,
  isCollectionDirty,
  syncCollection,
  smartCollectionSync,
} from './collection';

export {
  calendarQuery,
  calendarMultiGet,
  makeCalendar,
  fetchCalendars,
  fetchCalendarObjects,
  createCalendarObject,
  updateCalendarObject,
  deleteCalendarObject,
  syncCalendars,
} from './calendar';

export {
  addressBookQuery,
  fetchAddressBooks,
  fetchVCards,
  createVCard,
  updateVCard,
  deleteVCard,
} from './addressBook';

export {
  getBasicAuthHeaders,
  getOauthHeaders,
  fetchOauthTokens,
  refreshAccessToken,
} from './util/authHelper';
export { DAVNamespace, DAVNamespaceShorthandMap, DAVAttributeMap } from './consts';
export default {
  DAVNamespace,
  DAVNamespaceShorthandMap,
  DAVAttributeMap,
  ...client,
  ...request,
  ...collection,
  ...account,
  ...addressBook,
  ...calendar,
  getBasicAuthHeaders: authHelper.getBasicAuthHeaders,
  getOauthHeaders: authHelper.getOauthHeaders,
  fetchOauthTokens: authHelper.fetchOauthTokens,
  refreshAccessToken: authHelper.refreshAccessToken,
};

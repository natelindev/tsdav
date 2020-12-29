import * as client from './client';
import * as request from './request';
import * as collection from './collection';
import * as account from './account';
import * as addressBook from './addressBook';
import * as calendar from './calendar';
import * as authHelper from './util/authHelper';

import { DAVNamespace } from './consts';

export type {
  DAVProp,
  DAVFilter,
  DAVAuthHeaders,
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
  fetchCalendars,
  fetchCalendarObjects,
  createCalendarObject,
  updateCalendarObject,
  deleteCalendarObject,
  syncCalDAVAccount,
} from './calendar';

export {
  addressBookQuery,
  fetchAddressBooks,
  fetchVCards,
  createVCard,
  updateVCard,
  deleteVCard,
  syncCardDAVAccount,
} from './addressBook';

export { fetchOauthTokens, refreshAccessToken } from './util/authHelper';

export default {
  DAVNamespace,
  ...client,
  ...request,
  ...collection,
  ...account,
  ...addressBook,
  ...calendar,
  fetchOauthTokens: authHelper.fetchOauthTokens,
  refreshAccessToken: authHelper.refreshAccessToken,
};

import * as client from './client';
import * as request from './request';
import * as collection from './collection';
import * as account from './account';
import * as addressBook from './addressBook';
import * as calendar from './calendar';

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

export default {
  DAVNamespace,
  ...client,
  ...request,
  ...collection,
  ...account,
  ...addressBook,
  ...calendar,
};

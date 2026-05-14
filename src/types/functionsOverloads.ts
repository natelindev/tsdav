import { DAVAccount, DAVCalendar, DAVCollection, DAVObject } from './models';

type SmartCollectionSyncBaseParam<T extends DAVCollection> = {
  collection: T;
  method?: 'basic' | 'webdav';
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
  account?: DAVAccount;
};

export type SmartCollectionSyncDetailedResult<T extends DAVCollection> = Omit<T, 'objects'> & {
  objects: {
    created: DAVObject[];
    updated: DAVObject[];
    deleted: DAVObject[];
  };
};

export interface SmartCollectionSync {
  <T extends DAVCollection>(
    param: SmartCollectionSyncBaseParam<T> & {
      /** @deprecated Use smartCollectionSyncDetailed instead. */
      detailedResult: true;
    },
  ): Promise<SmartCollectionSyncDetailedResult<T>>;
  <T extends DAVCollection>(
    param: SmartCollectionSyncBaseParam<T> & {
      /** @deprecated Use smartCollectionSyncDetailed instead. */
      detailedResult?: false;
    },
  ): Promise<T>;
  <T extends DAVCollection>(
    param: SmartCollectionSyncBaseParam<T> & {
      /** @deprecated Use smartCollectionSyncDetailed instead. */
      detailedResult?: boolean;
    },
  ): Promise<T | SmartCollectionSyncDetailedResult<T>>;
}

export interface SmartCollectionSyncDetailed {
  <T extends DAVCollection>(
    param: SmartCollectionSyncBaseParam<T>,
  ): Promise<SmartCollectionSyncDetailedResult<T>>;
}

type SyncCalendarsBaseParam = {
  oldCalendars: DAVCalendar[];
  headers?: Record<string, string>;
  headersToExclude?: string[];
  fetchOptions?: RequestInit;
  fetch?: typeof fetch;
  account?: DAVAccount;
};

export type SyncCalendarsDetailedResult = {
  created: DAVCalendar[];
  updated: DAVCalendar[];
  deleted: DAVCalendar[];
};

export interface SyncCalendars {
  (
    params: SyncCalendarsBaseParam & {
      /** @deprecated Use syncCalendarsDetailed instead. */
      detailedResult: true;
    },
  ): Promise<SyncCalendarsDetailedResult>;
  (
    params: SyncCalendarsBaseParam & {
      /** @deprecated Use syncCalendarsDetailed instead. */
      detailedResult?: false;
    },
  ): Promise<DAVCalendar[]>;
  (
    params: SyncCalendarsBaseParam & {
      /** @deprecated Use syncCalendarsDetailed instead. */
      detailedResult?: boolean;
    },
  ): Promise<DAVCalendar[] | SyncCalendarsDetailedResult>;
}

export interface SyncCalendarsDetailed {
  (params: SyncCalendarsBaseParam): Promise<SyncCalendarsDetailedResult>;
}

import { DAVAccount, DAVCalendar, DAVCollection, DAVObject } from './models';

export interface SmartCollectionSync {
  <T extends DAVCollection>(
    collection: T,
    method?: 'basic' | 'webdav',
    options?: { headers?: { [key: string]: any }; account?: DAVAccount; detailedResult?: boolean }
  ): Promise<
    | T
    | (Omit<T, 'objects'> & {
        objects: {
          created: DAVObject[];
          updated: DAVObject[];
          deleted: DAVObject[];
        };
      })
  >;
}

export interface SyncCalendars {
  <
    T extends
      | {
          headers?: { [key: string]: any };
          account?: DAVAccount;
          detailedResult?: T;
        }
      | undefined
  >(
    oldCalendars: DAVCalendar[],
    options?: T
  ): Promise<T extends undefined ? DAVCalendar[] : never>;
  <T extends boolean>(
    oldCalendars: DAVCalendar[],
    options?: {
      headers?: { [key: string]: any };
      account?: DAVAccount;
      detailedResult?: T;
    }
  ): Promise<
    T extends true
      ? {
          created: DAVCalendar[];
          updated: DAVCalendar[];
          deleted: DAVCalendar[];
        }
      : DAVCalendar[]
  >;
  (
    oldCalendars: DAVCalendar[],
    options?: {
      headers?: { [key: string]: any };
      account?: DAVAccount;
      detailedResult?: boolean;
    }
  ): Promise<
    | {
        created: DAVCalendar[];
        updated: DAVCalendar[];
        deleted: DAVCalendar[];
      }
    | DAVCalendar[]
  >;
}

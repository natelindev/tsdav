import {
  DAVClient,
  createDAVClient,
  syncCalendars,
  makeCollection,
  DAVCalendar,
  DAVPropStat,
  SyncCalendarsDetailedResult,
  SmartCollectionSyncDetailedResult,
} from 'tsdav';

const client = new DAVClient({ serverUrl: 'https://example.com/', credentials: {} });
const accountType: 'caldav' | 'carddav' = client.accountType;
const ordinary: Promise<DAVCalendar[]> = client.syncCalendars({ oldCalendars: [] });
const explicit: Promise<DAVCalendar[]> = client.syncCalendars({
  oldCalendars: [],
  detailedResult: false,
});
const detailed: Promise<SyncCalendarsDetailedResult> = client.syncCalendars({
  oldCalendars: [],
  detailedResult: true,
});
const flag = Math.random() > 0.5;
const dynamic: Promise<DAVCalendar[] | SyncCalendarsDetailedResult> = client.syncCalendars({
  oldCalendars: [],
  detailedResult: flag,
});
client
  .syncCalendars({ oldCalendars: [] })
  .then((calendars) => calendars.map((calendar) => calendar.url));
const helper: Promise<DAVCalendar[]> = syncCalendars({ oldCalendars: [] });
const collection = { url: 'https://example.com/calendar/', label: 'Personal' };
const generic: Promise<typeof collection> = client.smartCollectionSync({ collection });
const genericDetailed: Promise<SmartCollectionSyncDetailedResult<typeof collection>> =
  client.smartCollectionSyncDetailed({ collection });
const callback: NonNullable<DAVCalendar['objectMultiGet']> = client.calendarMultiGet;
const propStat: DAVPropStat = { props: {}, status: 404, statusText: 'Not Found', ok: false };
const namedExport: typeof client.makeCollection = makeCollection;

async function factory() {
  const functional = await createDAVClient({ serverUrl: 'https://example.com/', credentials: {} });
  const normal: Promise<DAVCalendar[]> = functional.syncCalendars({ oldCalendars: [] });
  const detailed: Promise<SyncCalendarsDetailedResult> = functional.syncCalendars({
    oldCalendars: [],
    detailedResult: true,
  });
  const generic: Promise<typeof collection> = functional.smartCollectionSync({ collection });
  return { normal, detailed, generic };
}
void [
  accountType,
  ordinary,
  explicit,
  detailed,
  dynamic,
  helper,
  generic,
  genericDetailed,
  callback,
  propStat,
  namedExport,
  factory,
];

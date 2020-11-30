export enum DAVNamespace {
  CALENDAR_SERVER = 'http://calendarserver.org/ns/',
  CALDAV_APPLE = 'http://apple.com/ns/ical/',
  CALDAV = 'urn:ietf:params:xml:ns:caldav',
  CARDDAV = 'urn:ietf:params:xml:ns:carddav',
  DAV = 'DAV:',
}

export const DAVAttributeMap = {
  [DAVNamespace.CALDAV]: 'xmlns:c',
  [DAVNamespace.CARDDAV]: 'xmlns:card',
  [DAVNamespace.CALENDAR_SERVER]: 'xmlns:cs',
  [DAVNamespace.CALDAV_APPLE]: 'xmlns:ca',
  [DAVNamespace.DAV]: 'xmlns:d',
};

export const DAVNamespaceShorthandMap = {
  [DAVNamespace.CALDAV]: 'c',
  [DAVNamespace.CARDDAV]: 'card',
  [DAVNamespace.CALENDAR_SERVER]: 'cs',
  [DAVNamespace.CALDAV_APPLE]: 'ca',
  [DAVNamespace.DAV]: 'd',
};

export enum ICALObjects {
  VEVENT = 'VEVENT',
  VTODO = 'VTODO',
  VJOURNAL = 'VJOURNAL',
  VFREEBUSY = 'VFREEBUSY',
  VTIMEZONE = 'VTIMEZONE',
  VALARM = 'VALARM',
}

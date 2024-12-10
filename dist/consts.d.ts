export declare enum DAVNamespace {
    CALENDAR_SERVER = "http://calendarserver.org/ns/",
    CALDAV_APPLE = "http://apple.com/ns/ical/",
    CALDAV = "urn:ietf:params:xml:ns:caldav",
    CARDDAV = "urn:ietf:params:xml:ns:carddav",
    DAV = "DAV:"
}
export declare const DAVAttributeMap: {
    "urn:ietf:params:xml:ns:caldav": string;
    "urn:ietf:params:xml:ns:carddav": string;
    "http://calendarserver.org/ns/": string;
    "http://apple.com/ns/ical/": string;
    "DAV:": string;
};
export declare enum DAVNamespaceShort {
    CALDAV = "c",
    CARDDAV = "card",
    CALENDAR_SERVER = "cs",
    CALDAV_APPLE = "ca",
    DAV = "d"
}
export declare enum ICALObjects {
    VEVENT = "VEVENT",
    VTODO = "VTODO",
    VJOURNAL = "VJOURNAL",
    VFREEBUSY = "VFREEBUSY",
    VTIMEZONE = "VTIMEZONE",
    VALARM = "VALARM"
}

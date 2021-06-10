
# Constants

### DAVNamespace
xml namespace enum for convenience

| Name            | Value                          | Description                  |
| --------------- | ------------------------------ | ---------------------------- |
| CALENDAR_SERVER | http://calendarserver.org/ns/  | calendarserver.org namespace |
| CALDAV_APPLE    | http://apple.com/ns/ical/      | Apple CALDAV namespace       |
| CALDAV          | urn:ietf:params:xml:ns:caldav  | CALDAV namespace             |
| CARDDAV         | urn:ietf:params:xml:ns:carddav | CARDDAV namespace            |
| DAV             | DAV:                           | WEBDAV namespace             |



### DAVNamespaceShorthandMap

map WEBDAV namespace to shorthands to allow better readability when dealing with raw xml data

| Name            | Value |
| --------------- | ----- |
| CALDAV          | c     |
| CARDDAV         | card  |
| CALENDAR_SERVER | cs    |
| CALDAV_APPLE    | ca    |
| DAV             | d     |


### DAVAttributeMap

map WEBDAV namespace to attributes to allow better readability when dealing with raw xml data

| Name            | Value      |
| --------------- | ---------- |
| CALDAV          | xmlns:c    |
| CARDDAV         | xmlns:card |
| CALENDAR_SERVER | xmlns:cs   |
| CALDAV_APPLE    | xmlns:ca   |
| DAV             | xmlns:d    |


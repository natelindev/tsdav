```ts
export type DAVCollection = {
  objects?: DAVObject[];
  ctag?: string;
  description?: string;
  displayName?: string;
  reports?: any;
  resourcetype?: any;
  syncToken?: string;
  url: string;
};
```

- `objects` objects of the
- `ctag` [Collection Entity Tag](https://github.com/apple/ccs-calendarserver/blob/master/doc/Extensions/caldav-ctag.txt)
- `description` description of the collection
- `displayName` [display name of the collection](https://datatracker.ietf.org/doc/html/rfc2518#section-13.2)
- `reports` list of [reports that are supported by the
   resource](https://datatracker.ietf.org/doc/html/rfc3253#section-3.1.5). (in camel case), usually a string array
- `resourcetype` [type of the resource](https://datatracker.ietf.org/doc/html/rfc2518#section-13.9), usually a string array
- `syncToken` [the value of the synchronization token](https://datatracker.ietf.org/doc/html/rfc6578#section-4)
- `url` url of the resource
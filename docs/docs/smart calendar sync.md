---
sidebar_position: 8
---

# Smart calendar sync

To actually achieve two way syncing of calendar events between cloud provider and your service.

## preparation

You need to

#### create database structures to store the calendar info

for databases, you need following structures:

##### App calendar

your app's calendar object type like:

```ts
type AppCalendar = {
    id: string;
    userId: string;
    timezone?: string;
    name?: string;
    description?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
}
```

this table is used for your app's display, daily use, etc, optional if you do not alredy have a table like this or you do not want one-to-many relations with your app calendar, you can skip creating this table.



##### Caldav calendar

you need to store caldav calendar information obtained from `fetchCalendars`

```typescript
type CaldavCalendar = {
  id: string;
  userId: string;
  timezone: string;
  name: string;
  source: string; // your caldav provider name
  ctag: string; // obtained from remote
  syncToken: string; // obtained from remote
  url: string;
  credentialId:
  createAt: string;
};
```



##### credentials

save caldav calendar credentials in another table, encryption is recommended:

```ts
type CalendarCredential = {
  account: string;
  refreshToken?: string;
  password?: string;
  valid: boolean;
  source: // your caldav provider name
}
```



##### caldav calendar objects

you also need to store caldav calendar objects obtained from `fetchCalendarObjects`

```ts
export type CalendarObject = {
  id: string;
  calendarId: string; // foreign key reference the CaldavCalendar if needed
  url: string;
  etag: string;
  start: string; // recommend to have this field for easy filtering/sorting
  end: string; // recommend to have this field for easy filtering/sorting
  data: string; // actual ics data
};
```

to parse and obtain information from ics data, it's recommended to use a combination of

https://github.com/natelindev/pretty-jcal and https://github.com/kewisch/ical.js

for generating new ics data, it's recommended to use https://github.com/nwcell/ics.js/



## Actual syncing

First you need to have user go through authorization process and obtain valid `CalendarCredential`, the method differs for each caldav provider. You need to find and setup it yourself.

after having obtained the credentials, you can begin the actual sync

First you need to get all stored calendars for the user

```ts
const localCalendars = await this.db.getCalendarByUserIdAndSource(
   userId,
   source
);
```

then you need to create caldav client using credentials

```ts
const client = new DAVClient({
  serverUrl: 'https://caldav.icloud.com',
  credentials: {
    username: 'YOUR_APPLE_ID',
    password: 'YOUR_APP_SPECIFIC_PASSWORD',
  },
  authMethod: 'Basic',
  defaultAccountType: 'caldav',
});
```

##### Remote to local

you can use `syncCalendars` function from the lib with `detailedResult` set as `true`

```ts
const { created, updated, deleted } = await client.syncCalendars({
  oldCalendars: await Promise.all(
    localCalendars.map(async (lc) => ({
      displayName: lc.name,
      syncToken: lc.syncToken,
      ctag: lc.ctag,
      url: lc.url,
    }))
  ),
  detailedResult: true,
});
```

make sure you send the `syncToken` and `ctag`, this way the remote will know your last sync and identify the calendar changes.

now you have all calendar changes on remote. make actual changes to your database like:

```ts
await this.db.transaction(async (tx) => {

  await Promise.all(created.map(async (c) => {
    // created
    const calendarObjects = await client.fetchCalendarObjects({ calendar: c })

    if (calendarObjects.length > 0) {
      await Promise.all(
        calendarObjects.map((co) => {
          // parse start end time if needed
          // const parsedObject = parse(co);
          // const { start, end } = parsedObject;
          return this.db.createCalendarObject(tx, {
            ...co,
            // start,
            // end,
            calendarId: c.id
          })
        })
      )
    }
  }))

  // deleted
  if (deleted.length > 0) {
    await this.db.deleteByUrls(
      tx,
      filteredDeleted.map((d) => d.url)
    );
  }

  // updated
  const localCalendarsToBeUpdated = await this.db.getByUrls(
    tx,
    updated.map((u) => u.url)
  );

  // find out and apply the change on calendar
  await Promise.all(
    localCalendarsToBeUpdated.map(async (lc) => {
      const localObjects = await this.db.getCalendarById(
        tx,
        lc.id
      );
      const {
        created: createdObjects,
        updated: updatedObjects,
        deleted: deletedObjects,
      } = (
        await client.smartCollectionSync({
          collection: {
            url: lc.url,
            ctag: lc.ctag,
            syncToken: lc.syncToken,
            objects: localObjects,
            objectMultiGet: client.calendarMultiGet,
          },
          method: 'webdav',
          detailedResult: true,
        })
      ).objects;

      // apply changes to local calendar objects
      // created objects
      if (createdObjects.length > 0) {
        await Promise.all(
          createdObjects
            .filter((co) => co.url.includes('.ics'))
            .map((co) => {
              // parse start end time if needed
              // const parsedObject = parse(co);
              // const { start, end } = parsedObject;

              return this.db.createCalendarObject(tx, {
                ...co,
                // start,
                // end,
                url: URL.resolve(lc.url, co.url),
                calendarId: lc.id,
              });
            })
        );
      }

      // deleted objects
      if (deletedObjects.length > 0) {
        await this.db.deleteCalendarObjectByUrls(
          tx,
          deletedObjects.map((d) => URL.resolve(lc.url, d.url))
        );
      }

      // updated objects
      if (updatedObjects.length > 0) {
        await Promise.all(
          updatedObjects.map((uo) => {
            // parse start end time if needed
            // const parsedObject = parse(co);
            // const { start, end } = parsedObject;

            return this.db.updateCalendarObjectByUrl(
              tx,
              URL.resolve(lc.url, uo.url),
              {
                etag: uo.etag,
                data: uo.data,
                start,
                end,
              }
            );
          })
        );
      }
    })
  );

  // update the syncToken & ctag for the calendars to be updated
  await Promise.all(
    filteredUpdated.map((u) => {
      const lcu = localCalendarToBeUpdated.find((uo) => uo.url === u.url);
      if (!lcu) {
        throw new ValidationError(`local calendar with url ${u.url} not found `);
      }
      return this.db.updateCalendarById(tx, lcu.id, {
        syncToken: u.syncToken,
        ctag: u.ctag,
      });
    })
  );

})
```

##### Local to remote

when going local to remote, it's rather easy

just generate the ics data and then use `createCalendarObject` , `updateCalendarObject` and `deleteCalendarObject` directly on remote caldav calendars. Update your locally stored calendar objects in your database after remote operation success.

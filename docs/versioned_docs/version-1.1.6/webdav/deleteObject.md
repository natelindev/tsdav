---
sidebar_position: 5
---

## `deleteObject`

delete an object

```ts
const response = await deleteObject({
  url: 'https://caldav.icloud.com/123456/calendars/A5639426-B73B-4F90-86AB-D70F7F603E75/test.ics',
  etag: '"63758758580"',
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `url` **required**, url of object to delete
- `etag` the version string of content, if [etag](https://tools.ietf.org/id/draft-reschke-http-etag-on-write-08.html) changed, `data` must have been changed.
- `headers` request headers

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

send DELETE request with etag header
object will not be deleted if etag do not match

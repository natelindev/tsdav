---
sidebar_position: 7
---

## `deleteVCard`

delete one vcard on the target addressBook

```ts
const result = await deleteCalendarObject({
  vCard: {
    url: 'https://contacts.icloud.com/123456/carddavhome/card/test.vcf',
    etag: '"63758758580"',
  },
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `vCard` **required**, [DAVVCard](../types/DAVVCard.md) to delete
- `headers` request headers

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

use DELETE request to delete a new vcard

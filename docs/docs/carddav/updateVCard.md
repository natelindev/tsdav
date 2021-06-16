---
sidebar_position: 6
---

## `updateVCard`

create one vcard

```ts
const result = updateVCard({
  vCard: {
    url: 'https://contacts.icloud.com/123456/carddavhome/card/test.vcf',
    data: 'BEGIN:VCARD\nVERSION:3.0\nN:;Test BBB;;;\nFN:Test BBB\nUID:0976cf06-a0e8-44bd-9217-327f6907242c\nPRODID:-//Apple Inc.//iCloud Web Address Book 2109B35//EN\nREV:2021-06-16T01:28:23Z\nEND:VCARD',
    etag: '"63758758580"',
  },
});
```

### Arguments

- `vCard` **required**, [DAVVCard](../types/DAVVCard.md) to update
- `headers` request headers

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

use PUT request to update a new vcard

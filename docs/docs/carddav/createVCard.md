---
sidebar_position: 5
---

## `createVCard`

create one vcard on the target addressBook

```ts
const result = await createVCard({
  addressBook: addressBooks[0],
  filename: 'test.vcf'
  vCardString: 'BEGIN:VCARD\nVERSION:3.0\nN:;Test BBB;;;\nFN:Test BBB\nUID:0976cf06-a0e8-44bd-9217-327f6907242c\nPRODID:-//Apple Inc.//iCloud Web Address Book 2109B35//EN\nREV:2021-06-16T01:28:23Z\nEND:VCARD',
  headers: {
    authorization: 'Basic x0C9ueWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `addressBook` **required**, [DAVAddressBook](../types/DAVAddressBook.md)
- `filename` **required**, file name of the new vcard, should end in `.vcf`
- `vCardString` **required**, vcard file data
- `headers` request headers
- `headersToExclude` array of keys of the headers you want to exclude

### Return Value

[fetch api response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Behavior

use PUT request to create a new vcard

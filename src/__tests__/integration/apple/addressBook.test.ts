import { createAccount } from '../../../account';
import { createVCard, fetchAddressBooks, fetchVCards } from '../../../addressBook';
import { deleteObject } from '../../../request';
import { DAVAccount } from '../../../types/models';
import { getBasicAuthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;

beforeAll(async () => {
  authHeaders = getBasicAuthHeaders({
    username: process.env.ICLOUD_USERNAME,
    password: process.env.ICLOUD_APP_SPECIFIC_PASSWORD,
  });
  account = await createAccount({
    account: {
      serverUrl: 'https://contacts.icloud.com',
      accountType: 'carddav',
    },
    headers: authHeaders,
  });
});

test('fetchAddressBooks should be able to fetch addressBooks', async () => {
  const addressBooks = await fetchAddressBooks({
    account,
    headers: authHeaders,
  });
  expect(addressBooks.length > 0).toBe(true);
  expect(addressBooks.every((a) => a.url.length > 0)).toBe(true);
});

test('createVCard should be able to create vcard', async () => {
  const addressBooks = await fetchAddressBooks({
    account,
    headers: authHeaders,
  });
  const createResult = await createVCard({
    addressBook: addressBooks[0],
    vCardString: `BEGIN:VCARD
VERSION:3.0
N:;Test BBB;;;
FN:Test BBB
UID:0976cf06-a0e8-44bd-9217-327f6907242c
PRODID:-//Apple Inc.//iCloud Web Address Book 2109B35//EN
REV:2021-06-16T01:28:23Z
END:VCARD`,
    filename: 'test.vcf',
    headers: authHeaders,
  });

  expect(createResult.ok).toBe(true);

  const deleteResult = await deleteObject({
    url: new URL('test.vcf', addressBooks[0].url).href,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

test('fetchVCards should be able to fetch vcards', async () => {
  const addressBooks = await fetchAddressBooks({
    account,
    headers: authHeaders,
  });

  const createResult = await createVCard({
    addressBook: addressBooks[0],
    vCardString: `BEGIN:VCARD
VERSION:3.0
N:;Test ABC;;;
FN:Test ABC
UID:5123fcac-0ed3-4d77-ae93-5f36984747b4
PRODID:-//Apple Inc.//iCloud Web Address Book 2109B35//EN
REV:2021-06-16T01:28:23Z
END:VCARD`,
    filename: 'test233.vcf',
    headers: authHeaders,
  });

  expect(createResult.ok).toBe(true);

  const vcards = await fetchVCards({
    addressBook: addressBooks[0],
    headers: authHeaders,
  });

  expect(vcards.length > 0).toBe(true);
  expect(vcards.every((o) => o.data.length > 0 && o.etag.length > 0 && o.url.length > 0)).toBe(
    true
  );

  const deleteResult = await deleteObject({
    url: new URL('test233.vcf', addressBooks[0].url).href,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

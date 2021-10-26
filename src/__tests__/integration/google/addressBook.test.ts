import fsp from 'fs/promises';

import { createAccount } from '../../../account';
import { createVCard, fetchAddressBooks, fetchVCards } from '../../../addressBook';
import { deleteObject } from '../../../request';
import { DAVAccount } from '../../../types/models';
import { getOauthHeaders } from '../../../util/authHelpers';

let authHeaders: {
  authorization?: string;
};

let account: DAVAccount;

beforeAll(async () => {
  authHeaders = (
    await getOauthHeaders({
      username: process.env.CREDENTIAL_GOOGLE_USERNAME,
      refreshToken: process.env.CREDENTIAL_GOOGLE_REFRESH_TOKEN,
      clientId: process.env.CREDENTIAL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.CREDENTIAL_GOOGLE_CLIENT_SECRET,
    })
  ).headers;
  account = await createAccount({
    account: {
      serverUrl: 'https://apidata.googleusercontent.com/carddav/v2/',
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
  const vcard1 = await fsp.readFile(`${__dirname}/../data/vcard/1.vcf`, 'utf8');
  const createResult = await createVCard({
    addressBook: addressBooks[0],
    vCardString: vcard1,
    filename: '1.vcf',
    headers: authHeaders,
  });

  expect(createResult.ok).toBe(true);

  const deleteResult = await deleteObject({
    url: new URL('1.vcf', addressBooks[0].url).href,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

test('fetchVCards should be able to fetch vcards', async () => {
  const addressBooks = await fetchAddressBooks({
    account,
    headers: authHeaders,
  });

  const vcard2 = await fsp.readFile(`${__dirname}/../data/vcard/2.vcf`, 'utf8');
  const createResult = await createVCard({
    addressBook: addressBooks[0],
    vCardString: vcard2,
    filename: '2.vcf',
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
    url: new URL('2.vcf', addressBooks[0].url).href,
    headers: authHeaders,
  });

  expect(deleteResult.ok).toBe(true);
});

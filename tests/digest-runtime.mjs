import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createDAVClient, DAVClient, DigestUnsupportedError } from '../dist/tsdav.mjs';
import { startDigestServer } from './fixtures/digest-http-server.mjs';

const server = await startDigestServer();
try {
  if (!globalThis.crypto) {
    const basic = await createDAVClient({
      serverUrl: server.origin,
      credentials: server.credentials,
    });
    const result = await basic.davRequest({
      url: `${server.origin}/dav/MD5/resource`,
      init: { method: 'GET' },
      parseOutgoing: false,
    });
    assert.equal(result[0].status, 401);
    const digest = new DAVClient({
      serverUrl: server.origin,
      credentials: server.credentials,
      authMethod: 'Digest',
    });
    await assert.rejects(
      digest.davRequest({ url: `${server.origin}/dav/MD5/resource`, init: { method: 'GET' } }),
      DigestUnsupportedError,
    );
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }

  for (const algorithm of ['MD5', 'MD5-sess', 'SHA-256', 'SHA-256-sess']) {
    const url = `${server.origin}/dav/${algorithm}/resource`;
    const client = await createDAVClient({
      serverUrl: server.origin,
      credentials: server.credentials,
      authMethod: 'Digest',
    });
    const before = server.requests.length;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.davRequest({
        url,
        init: { method: 'GET' },
        parseOutgoing: false,
      });
      assert.equal(response[0].status, 200);
    }
    assert.equal(server.requests.length - before, 3, `${algorithm} should only need one challenge`);
    assert.equal((await client.createObject({ url, data: 'event' })).status, 201);
    const publicResponse = await client.davRequest({
      url: `${server.origin}/public`,
      init: { method: 'GET' },
      parseOutgoing: false,
    });
    assert.equal(publicResponse[0].status, 200);
    assert.equal(server.requests.at(-1).authorization, undefined);
  }

  const redirectClient = new DAVClient({
    serverUrl: server.origin,
    credentials: server.credentials,
    authMethod: 'Digest',
  });
  assert.equal(
    (await redirectClient.createObject({ url: `${server.origin}/old-put`, data: 'event' })).status,
    201,
  );
  const basicClient = await createDAVClient({
    serverUrl: server.origin,
    credentials: server.credentials,
    authMethod: 'Basic',
  });
  assert.equal(
    (
      await basicClient.davRequest({
        url: `${server.origin}/old-get`,
        init: { method: 'GET' },
        parseOutgoing: false,
      })
    )[0].status,
    200,
  );
  const wrong = await createDAVClient({
    serverUrl: server.origin,
    credentials: { ...server.credentials, password: 'wrong' },
    authMethod: 'Digest',
  });
  const before = server.requests.length;
  assert.equal(
    (await wrong.createObject({ url: `${server.origin}/dav/MD5/resource`, data: 'event' })).status,
    401,
  );
  assert.equal(server.requests.length - before, 2);
  console.log('digest-runtime-ok');
} finally {
  await server.close();
}

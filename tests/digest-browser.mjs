import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startDigestServer } from './fixtures/digest-http-server.mjs';

const server = await startDigestServer();
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  const page = await browser.newPage();
  await page.goto(server.origin);
  await page.waitForFunction(() => Boolean(window.tsdav));
  const results = await page.evaluate(
    async ({ origin, credentials }) => {
      const { DAVClient, createDAVClient } = window.tsdav;
      const client = new DAVClient({
        serverUrl: origin,
        credentials,
        authMethod: 'Digest',
        fetchOptions: { signal: AbortSignal.timeout(15000) },
      });
      const request = (url) =>
        client.davRequest({ url, init: { method: 'GET' }, parseOutgoing: false });
      const redirected = await request(`${origin}/old-get`);
      const statuses = [];
      for (const algorithm of ['MD5', 'MD5-sess', 'SHA-256', 'SHA-256-sess']) {
        for (let attempt = 0; attempt < 2; attempt++) {
          statuses.push((await request(`${origin}/dav/${algorithm}/resource`))[0].status);
        }
      }
      const created = await client.createObject({
        url: `${origin}/dav/MD5/new.ics`,
        data: 'event',
      });
      const propfind = await client.davRequest({
        url: `${origin}/dav/MD5/resource`,
        init: { method: 'PROPFIND' },
        parseOutgoing: false,
      });
      let writeError;
      try {
        await client.createObject({ url: `${origin}/old-put`, data: 'event' });
      } catch (error) {
        writeError = error.message;
      }
      const basic = await createDAVClient({
        serverUrl: origin,
        credentials,
        authMethod: 'Basic',
        fetchOptions: { credentials: 'omit', signal: AbortSignal.timeout(15000) },
      });
      const negotiated = await basic.davRequest({
        url: `${origin}/old-get`,
        init: { method: 'GET' },
        parseOutgoing: false,
      });
      return {
        redirected: redirected[0].status,
        statuses,
        created: created.status,
        propfind: propfind[0].status,
        writeError,
        negotiated: negotiated[0].status,
      };
    },
    { origin: server.origin, credentials: server.credentials },
  );
  assert.equal(results.redirected, 200);
  assert.deepEqual(results.statuses, Array(8).fill(200));
  assert.equal(results.created, 201);
  assert.equal(results.propfind, 200);
  assert.equal(results.negotiated, 200);
  assert.match(results.writeError, /opaque browser redirect/);
  assert.equal(server.requests.filter(({ path }) => path === '/old-put').length, 1);
  console.log('digest-browser-ok');
} finally {
  await browser?.close();
  await server.close();
}

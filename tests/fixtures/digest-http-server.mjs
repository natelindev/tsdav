import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const credentials = { username: 'testuser', password: 'testpassword' };
const hash = (algorithm, value) =>
  createHash(algorithm.startsWith('MD5') ? 'md5' : 'sha256')
    .update(value)
    .digest('hex');
const parse = (header) =>
  Object.fromEntries(
    [...header.matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]+))/g)].map(([, key, quoted, plain]) => [
      key,
      quoted ?? plain,
    ]),
  );

export const startDigestServer = async () => {
  const requests = [];
  const sessionKeys = new Map();
  const counts = new Set();
  const server = createServer(async (request, response) => {
    const path = request.url;
    const auth = request.headers.authorization;
    requests.push({ path, method: request.method, authorization: auth });
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate');
    if (path === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    if (path === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        '<!doctype html><script type="module">import * as tsdav from "/tsdav.js"; window.tsdav = tsdav;</script>',
      );
      return;
    }
    if (path === '/tsdav.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(readFileSync(new URL('../../dist/tsdav.js', import.meta.url)));
      return;
    }
    if (path === '/old-get' || path === '/old-put') {
      response.writeHead(307, { Location: '/dav/MD5/resource' });
      response.end();
      return;
    }
    if (path === '/public') {
      response.end('public');
      return;
    }
    const algorithm = path.split('/')[2] || 'MD5';
    const realm = `realm-${algorithm}`;
    const nonce = `nonce-${algorithm}`;
    const reject = () => {
      response.writeHead(401, {
        'WWW-Authenticate': `Digest realm="${realm}", nonce="${nonce}", qop="auth", algorithm=${algorithm}, domain="/dav/${algorithm}/"`,
      });
      response.end();
    };
    if (!auth?.startsWith('Digest ')) {
      reject();
      return;
    }
    const params = parse(auth);
    if (params.uri !== path) {
      response.writeHead(400);
      response.end();
      return;
    }
    const baseKey = hash(algorithm, `${credentials.username}:${realm}:${credentials.password}`);
    const sessionId = `${algorithm}:${nonce}`;
    if (algorithm.endsWith('-sess') && !sessionKeys.has(sessionId)) {
      sessionKeys.set(sessionId, hash(algorithm, `${baseKey}:${nonce}:${params.cnonce}`));
    }
    const key = algorithm.endsWith('-sess') ? sessionKeys.get(sessionId) : baseKey;
    const expected = hash(
      algorithm,
      `${key}:${nonce}:${params.nc}:${params.cnonce}:auth:${hash(algorithm, `${request.method}:${path}`)}`,
    );
    const replayId = `${algorithm}:${params.cnonce}:${params.nc}`;
    if (
      params.username !== credentials.username ||
      params.response !== expected ||
      counts.has(replayId)
    ) {
      reject();
      return;
    }
    counts.add(replayId);
    for await (const _chunk of request) {
      /* drain the request body */
    }
    response.writeHead(request.method === 'PUT' ? 201 : 200, { 'Content-Type': 'text/plain' });
    response.end(request.method === 'HEAD' ? undefined : 'authenticated');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    credentials,
    requests,
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  };
};

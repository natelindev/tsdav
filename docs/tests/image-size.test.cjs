const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

// Resolve the exact copy consumed by Docusaurus, including the replacement alias.
const fromCore = createRequire(require.resolve('@docusaurus/core/package.json'));
const fromLoader = createRequire(fromCore.resolve('@docusaurus/mdx-loader/package.json'));
const packageRoot = path.dirname(path.dirname(fromLoader.resolve('image-size')));

const uint32 = (value) => {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32BE(value);
  return bytes;
};
const box = (name, payload, size = payload.length + 8) =>
  Buffer.concat([uint32(size), Buffer.from(name), payload]);
const icns = (entrySize) =>
  Buffer.concat([Buffer.from('icns'), uint32(16), Buffer.from('is32'), uint32(entrySize)]);
const heif = (size) => {
  const ispe = box('ispe', Buffer.concat([uint32(0), uint32(32), uint32(24)]), size);
  return Buffer.concat([
    box('ftyp', Buffer.concat([Buffer.from('avif'), uint32(0)])),
    box('meta', Buffer.concat([uint32(0), box('iprp', box('ipco', ispe))])),
  ]);
};
const stream = Buffer.from([0xff, 0x0a, 0x41, 0x00]);
const jxl = (size) =>
  Buffer.concat([
    box('JXL ', Buffer.from([0x0d, 0x0a, 0x87, 0x0a])),
    box('ftyp', Buffer.concat([Buffer.from('jxl '), uint32(0)])),
    box('jxlp', Buffer.concat([uint32(0x80000000), stream]), size),
  ]);

const fixtures = [
  { name: 'ICNS zero entry length', bytes: icns(0), error: 'Invalid ICNS, no sizes found' },
  { name: 'ICNS undersized entry', bytes: icns(4), error: 'Invalid ICNS, no sizes found' },
  {
    name: 'valid SVG',
    bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24"></svg>'),
    dimensions: [32, 24],
  },
  { name: 'valid ICNS', bytes: icns(8), dimensions: [16, 16] },
  { name: 'HEIF zero-sized final box', bytes: heif(0), dimensions: [32, 24] },
  { name: 'HEIF undersized box', bytes: heif(4), error: 'Invalid HEIF, no sizes found' },
  { name: 'valid HEIF', bytes: heif(20), dimensions: [32, 24] },
  { name: 'JXL zero-sized final box', bytes: jxl(0), dimensions: [8, 8] },
  { name: 'JXL undersized box', bytes: jxl(4), error: 'No codestream found in JXL container' },
  { name: 'valid JXL', bytes: jxl(16), dimensions: [8, 8] },
  {
    name: 'valid PNG',
    bytes: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=',
      'base64',
    ),
    dimensions: [1, 1],
  },
];

for (const moduleFormat of ['cjs', 'mjs']) {
  for (const fromFile of [false, true]) {
    for (const fixture of fixtures) {
      test(`${moduleFormat} ${fromFile ? 'file' : 'buffer'}: ${fixture.name}`, () => {
        // A parser regression must fail the test, never hang the test runner.
        const child = spawnSync(
          process.execPath,
          [
            '--input-type=module',
            '-e',
            `
          import { pathToFileURL } from 'node:url';
          import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
          import { tmpdir } from 'node:os';
          import path from 'node:path';
          const mod = await import(pathToFileURL(${JSON.stringify(path.join(packageRoot, 'dist', `${fromFile ? 'fromFile' : 'index'}.${moduleFormat}`))}));
          const bytes = Buffer.from(${JSON.stringify(fixture.bytes.toString('base64'))}, 'base64');
          let directory;
          try {
            let result;
            if (${fromFile}) {
              directory = mkdtempSync(path.join(tmpdir(), 'tsdav-image-size-'));
              const file = path.join(directory, 'fixture');
              writeFileSync(file, bytes);
              result = await mod.imageSizeFromFile(file);
            } else {
              result = mod.imageSize(bytes);
            }
            console.log(JSON.stringify({ dimensions: [result.width, result.height] }));
          } catch (error) {
            console.log(JSON.stringify({ error: error.message }));
          } finally {
            if (directory) rmSync(directory, { recursive: true, force: true });
          }
        `,
          ],
          { encoding: 'utf8', timeout: 2000 },
        );
        assert.ifError(child.error);
        assert.equal(child.status, 0, child.stderr);
        const result = JSON.parse(child.stdout);
        if (fixture.error) assert.equal(result.error, fixture.error);
        else assert.deepEqual(result.dimensions, fixture.dimensions);
      });
    }
  }
}

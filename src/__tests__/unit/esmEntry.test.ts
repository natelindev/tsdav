import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Regression for the ESM entry that package.json#module points at. This guards
// against native Node ESM loader issues by actually loading the built bundle.
//
// The test is skipped unless `dist/tsdav.esm.js` exists so `pnpm test` keeps
// working without a prior `pnpm build`. CI runs this after `pnpm build` or
// as a post-publish sanity check.
const distDir = path.resolve(__dirname, '../../../dist');
const esmEntry = path.join(distDir, 'tsdav.esm.js');
const hasDist = existsSync(esmEntry);

describe.skipIf(!hasDist)('ESM entry (dist/tsdav.esm.js)', () => {
  it('loads successfully under native Node ESM and exposes DAVClient', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'tsdav-esm-'));
    // Mark the scratch dir as an ESM package so Node treats `index.mjs` as
    // ESM without surprises.
    writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
    const script = `
      import * as tsdav from ${JSON.stringify(esmEntry)};
      if (typeof tsdav.DAVClient !== 'function') {
        throw new Error('DAVClient not exported from built ESM bundle');
      }
      // Exercise the Basic auth code path as defense in depth; past ESM
      // loader issues showed up around this helper's encoding implementation.
      const headers = tsdav.getBasicAuthHeaders({ username: 'u', password: 'p' });
      if (headers.authorization !== 'Basic dTpw') {
        throw new Error('Basic auth header was not encoded correctly');
      }
      new tsdav.DAVClient({
        serverUrl: 'http://example.com',
        credentials: { username: 'u', password: 'p' },
      });
      console.log('ok');
    `;
    const scriptPath = path.join(tmp, 'index.mjs');
    writeFileSync(scriptPath, script);

    const out = execFileSync(process.execPath, [scriptPath], {
      encoding: 'utf8',
      // Ensure we resolve node_modules from the repo root, not the scratch
      // dir.
      cwd: path.resolve(__dirname, '../../..'),
    });
    expect(out.trim()).toBe('ok');
  });
});

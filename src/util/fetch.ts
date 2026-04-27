/**
 * Resolve the runtime `fetch` implementation.
 *
 * All supported runtimes expose a standards-compliant `fetch` on
 * `globalThis`:
 *   - Node.js >= 18 (the minimum declared in package.json#engines)
 *   - Modern browsers
 *   - Bun (all versions)
 *   - Deno (all versions)
 *   - Cloudflare Workers, Electron, KaiOS 3+
 *
 * Exotic hosts without a global `fetch` must either install a polyfill on
 * `globalThis` before importing tsdav, or pass their own `fetch`
 * implementation to `createDAVClient`, the `DAVClient` constructor, or the
 * individual request helpers.
 */
const resolveFetch = (): typeof globalThis.fetch => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  // Return a thunk that throws on first invocation rather than at module
  // load time, so that consumers who always supply their own `fetch` via
  // the public API do not trip this check merely by importing tsdav.
  return ((): never => {
    throw new Error(
      'tsdav: global fetch is not available in this runtime. ' +
        'Upgrade to Node.js >= 18, run under a browser/Bun/Deno, or install a fetch polyfill ' +
        'on globalThis before importing tsdav. You can also pass a custom `fetch` implementation ' +
        'to `createDAVClient`, `DAVClient`, or individual request helpers.',
    );
  }) as unknown as typeof globalThis.fetch;
};

export const fetch = resolveFetch();

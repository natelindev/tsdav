import crossFetch from 'cross-fetch';

/**
 * Cloudflare Workers and some modern environments have a native fetch on globalThis.
 * We prefer it over cross-fetch to avoid compatibility issues with the polyfill.
 */
const getFetch = (): typeof crossFetch => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  // Fallback to cross-fetch
  return crossFetch;
};

export const fetch = getFetch();

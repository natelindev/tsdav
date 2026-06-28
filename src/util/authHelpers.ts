import getLogger from 'debug';

import { DAVTokens } from '../types/DAVTypes';
import { DAVCredentials } from '../types/models';
import { fetch } from './fetch';
import { findMissingFieldNames, hasFields } from './typeHelpers';

const debug = getLogger('tsdav:authHelper');
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const NON_LATIN1_BASIC_AUTH_MESSAGE =
  'The string to be encoded contains characters outside of the Latin1 range.';

class InvalidCharacterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCharacterError';
  }
}

const assertLatin1 = (charCode: number): void => {
  if (charCode > 0xff) {
    throw new InvalidCharacterError(NON_LATIN1_BASIC_AUTH_MESSAGE);
  }
};

const encodeBase64 = (input: string): string => {
  let output = '';
  let position = 0;

  while (position < input.length) {
    const first = input.charCodeAt(position);
    position += 1;
    assertLatin1(first);

    if (position === input.length) {
      output += BASE64_ALPHABET[Math.floor(first / 4)];
      output += `${BASE64_ALPHABET[(first % 4) * 16]}==`;
      break;
    }

    const second = input.charCodeAt(position);
    position += 1;
    assertLatin1(second);

    if (position === input.length) {
      output += BASE64_ALPHABET[Math.floor(first / 4)];
      output += BASE64_ALPHABET[(first % 4) * 16 + Math.floor(second / 16)];
      output += `${BASE64_ALPHABET[(second % 16) * 4]}=`;
      break;
    }

    const third = input.charCodeAt(position);
    position += 1;
    assertLatin1(third);

    output += BASE64_ALPHABET[Math.floor(first / 4)];
    output += BASE64_ALPHABET[(first % 4) * 16 + Math.floor(second / 16)];
    output += BASE64_ALPHABET[(second % 16) * 4 + Math.floor(third / 64)];
    output += BASE64_ALPHABET[third % 64];
  }

  return output;
};

/**
 * Provide given params as default params to given function with optional params.
 *
 * suitable only for one param functions
 * params are shallow merged
 */
export const defaultParam =
  <F extends (...args: any[]) => any>(fn: F, params: Partial<Parameters<F>[0]>) =>
  (...args: Parameters<F>): ReturnType<F> => {
    return fn({ ...params, ...args[0] });
  };

export const getBasicAuthHeaders = (credentials: DAVCredentials): { authorization?: string } => {
  // NOTE: never log the actual token. Even under DEBUG it would leak
  // credentials to stdout / log aggregators.
  debug(`Basic auth token generated for user "${credentials.username ?? ''}"`);
  return {
    authorization: `Basic ${encodeBase64(`${credentials.username}:${credentials.password}`)}`,
  };
};

export const getBearerAuthHeaders = (credentials: DAVCredentials): { authorization?: string } => {
  return {
    authorization: `Bearer ${credentials.accessToken}`,
  };
};

export const fetchOauthTokens = async (
  credentials: DAVCredentials,
  fetchOptions?: RequestInit,
  fetchOverride?: typeof fetch,
): Promise<DAVTokens> => {
  const requireFields: Array<keyof DAVCredentials> = [
    'authorizationCode',
    'redirectUrl',
    'clientId',
    'clientSecret',
    'tokenUrl',
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(
      `Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`,
    );
  }

  const param = new URLSearchParams({
    grant_type: 'authorization_code',
    code: credentials.authorizationCode,
    redirect_uri: credentials.redirectUrl,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  debug(`Fetching oauth tokens from ${credentials.tokenUrl}`);

  const requestFetch = fetchOverride ?? fetch;
  const response = await requestFetch(credentials.tokenUrl, {
    method: 'POST',
    body: param.toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    ...(fetchOptions ?? {}),
  });

  if (response.ok) {
    const tokens: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    } = await response.json();
    return tokens;
  }
  debug(`Fetch Oauth tokens failed with status ${response.status}`);
  return {};
};

export const refreshAccessToken = async (
  credentials: DAVCredentials,
  fetchOptions?: RequestInit,
  fetchOverride?: typeof fetch,
): Promise<DAVTokens> => {
  const requireFields: Array<keyof DAVCredentials> = [
    'refreshToken',
    'clientId',
    'clientSecret',
    'tokenUrl',
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(
      `Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`,
    );
  }
  const param = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: 'refresh_token',
  });
  const requestFetch = fetchOverride ?? fetch;
  const response = await requestFetch(credentials.tokenUrl, {
    method: 'POST',
    body: param.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(fetchOptions ?? {}),
  });

  if (response.ok) {
    // Some providers (e.g. Google) rotate refresh tokens. Pass the full
    // payload back to callers so they can persist whichever fields were
    // returned.
    const tokens = (await response.json()) as DAVTokens;
    return tokens;
  }
  debug(`Refresh access token failed with status ${response.status}`);
  return {};
};

/**
 * Resolve OAuth headers for the given credentials.
 *
 * This will mutate `credentials` in-place with the freshly issued
 * `accessToken`, `refreshToken` (if rotated by the provider), and an
 * `expiration` timestamp (ms since epoch). Callers that persist credentials
 * across sessions should re-read these fields from the same credentials
 * object after this call.
 */
export const getOauthHeaders = async (
  credentials: DAVCredentials,
  fetchOptions?: RequestInit,
  fetchOverride?: typeof fetch,
): Promise<{ tokens: DAVTokens; headers: { authorization?: string } }> => {
  debug('Fetching oauth headers');
  let tokens: DAVTokens = {};
  let didRefresh = false;
  if (!credentials.refreshToken) {
    // No refresh token, fetch new tokens
    tokens = await fetchOauthTokens(credentials, fetchOptions, fetchOverride);
    didRefresh = true;
  } else if (
    (credentials.refreshToken && !credentials.accessToken) ||
    Date.now() > (credentials.expiration ?? 0)
  ) {
    // have refresh token, but no accessToken, fetch access token only
    // or have both, but accessToken was expired
    tokens = await refreshAccessToken(credentials, fetchOptions, fetchOverride);
    didRefresh = true;
  } else {
    // existing access token is still valid; reuse it
    tokens = {
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    };
  }

  if (didRefresh) {
    // Persist refreshed tokens on the credentials object so that subsequent
    // invocations (and the caller's external storage, if they hold a
    // reference) see the updated values.
    /* eslint-disable no-param-reassign */
    if (tokens.access_token) {
      credentials.accessToken = tokens.access_token;
    }
    if (tokens.refresh_token) {
      credentials.refreshToken = tokens.refresh_token;
    }
    if (typeof tokens.expires_in === 'number') {
      credentials.expiration = Date.now() + tokens.expires_in * 1000;
    }
    /* eslint-enable no-param-reassign */
  }

  debug('Oauth tokens obtained');

  return {
    tokens,
    headers: tokens.access_token ? { authorization: `Bearer ${tokens.access_token}` } : {},
  };
};

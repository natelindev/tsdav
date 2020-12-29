import { encode } from 'base-64';
import fetch from 'cross-fetch';
import getLogger from 'debug';
import { DAVAuthHeaders, DAVTokens } from 'DAVTypes';

import { DAVCredentials } from '../types/models';

const debug = getLogger('tsdav:authHelper');

/**
 * Caveat: Do not use this function where you could have object parameters before options
 * since appendHeaders cannot determine if its the options parameter
 * i.e.
 * Ok to use appendHeaders: function (a: string, b: number, options?: { headers?: {[key:string]: any}})
 * Not ok to use appendHeaders: function (a: string, b: {test: string}, options?: { headers?: {[key:string]: any}})
 */
export const appendHeaders = <
  T extends unknown[],
  U extends (...args: [...T, { headers?: { [key: string]: any } }]) => any
>(
  headers: { [key: string]: any },
  fn: U
) => (...args: Parameters<U>): ReturnType<U> => {
  const prev = args.slice(0, -1) as T;
  const [last] = args.slice(-1) as { headers?: { [key: string]: any } }[];
  if (
    (last && last.headers) ||
    (!Array.isArray(last) && typeof last === 'object' && last !== null)
  ) {
    return fn(...prev, { ...last, headers: { ...headers, ...last.headers } });
  }
  return fn(...([...prev, last] as T), { headers });
};

export const getBasicAuthHeaders = (credentials: DAVCredentials): DAVAuthHeaders => {
  debug(`Basic auth token generated: ${encode(`${credentials.username}:${credentials.password}`)}`);
  return {
    authorization: `Basic ${encode(`${credentials.username}:${credentials.password}`)}`,
  };
};

export const fetchOauthTokens = async (credentials: DAVCredentials): Promise<DAVTokens> => {
  if (
    !credentials.authorizationCode ||
    !credentials.redirectUrl ||
    !credentials.clientId ||
    !credentials.clientSecret ||
    !credentials.tokenUrl
  ) {
    throw new Error('Oauth credentials missing');
  }

  const param = new URLSearchParams({
    grant_type: 'authorization_code',
    code: credentials.authorizationCode,
    redirect_uri: credentials.redirectUrl,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  debug(credentials.tokenUrl);
  debug(param.toString());

  const response = await fetch(credentials.tokenUrl, {
    method: 'POST',
    body: param.toString(),
    headers: {
      'content-length': `${param.toString().length}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.ok) {
    const tokens: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    } = await response.json();
    return tokens;
  }
  debug(`Fetch Oauth tokens failed: ${await response.text()}`);
  return {};
};

export const refreshAccessToken = async (
  credentials: DAVCredentials
): Promise<{
  access_token?: string;
  expires_in?: number;
}> => {
  if (
    !credentials.refreshToken ||
    !credentials.clientId ||
    !credentials.clientSecret ||
    !credentials.tokenUrl
  ) {
    throw new Error('Oauth credentials missing');
  }
  const param = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(credentials.tokenUrl, {
    method: 'POST',
    body: param.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.ok) {
    const tokens: {
      access_token: string;
      expires_in: number;
    } = await response.json();
    return tokens;
  }
  debug(`Refresh access token failed: ${await response.text()}`);
  return {};
};

export const getOauthHeaders = async (
  credentials: DAVCredentials
): Promise<{ tokens: DAVTokens; headers: DAVAuthHeaders }> => {
  debug('Fetching oauth headers');
  let tokens: DAVTokens = {};
  if (!credentials.refreshToken) {
    // No refresh token, fetch new tokens
    tokens = await fetchOauthTokens(credentials);
  } else if (
    (credentials.refreshToken && !credentials.accessToken) ||
    Date.now() > (credentials.expiration ?? 0)
  ) {
    // have refresh token, but no accessToken, fetch access token only
    // or have both, but accessToken was expired
    tokens = await refreshAccessToken(credentials);
  }
  // now we should have valid access token
  debug(`Oauth tokens fetched: ${tokens.access_token}`);

  return {
    tokens,
    headers: {
      authorization: `Bearer ${tokens.access_token}`,
    },
  };
};

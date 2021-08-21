import { encode } from 'base-64';
import fetch from 'cross-fetch';
import getLogger from 'debug';

import { DAVTokens } from '../types/DAVTypes';
import { DAVCredentials } from '../types/models';
import { findMissingFieldNames, hasFields } from './typeHelpers';

const debug = getLogger('tsdav:authHelper');

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
  debug(`Basic auth token generated: ${encode(`${credentials.username}:${credentials.password}`)}`);
  return {
    authorization: `Basic ${encode(`${credentials.username}:${credentials.password}`)}`,
  };
};

export const fetchOauthTokens = async (credentials: DAVCredentials): Promise<DAVTokens> => {
  const requireFields: Array<keyof DAVCredentials> = [
    'authorizationCode',
    'redirectUrl',
    'clientId',
    'clientSecret',
    'tokenUrl',
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(
      `Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`
    );
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
  const requireFields: Array<keyof DAVCredentials> = [
    'refreshToken',
    'clientId',
    'clientSecret',
    'tokenUrl',
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(
      `Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`
    );
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
): Promise<{ tokens: DAVTokens; headers: { authorization?: string } }> => {
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

import { encode } from 'base-64';
import fetch from 'cross-fetch';
import getLogger from 'debug';
import { DAVAuthHeaders, DAVTokens } from 'DAVTypes';

import { DAVCredentials } from '../types/models';

const debug = getLogger('tsdav:authHelper');

export const getBasicAuthHeaders = (credentials: DAVCredentials): DAVAuthHeaders => {
  debug(`Basic auth token generated: ${encode(`${credentials.username}:${credentials.password}`)}`);
  return {
    Authorization: `Basic ${encode(`${credentials.username}:${credentials.password}`)}`,
  };
};

export const fetchOauthTokens = async (credentials: DAVCredentials): Promise<DAVTokens> => {
  const param = new URLSearchParams({
    grant_type: 'authorization_code',
    code: credentials.authorizationCode,
    redirect_uri: credentials.redirectUrl,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
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
  let tokens: DAVTokens;
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
  debug(`Oauth tokens fetched: ${tokens}`);

  return {
    tokens,
    headers: {
      Authorization: tokens.access_token,
    },
  };
};

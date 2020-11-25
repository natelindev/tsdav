import fetch from 'cross-fetch';
import getLogger from 'debug';

import { DAVCredentials } from '../model/davCredentials';

const debug = getLogger('tsdav:oauth');

export type Tokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export const fetchOauthTokens = async (credentials: DAVCredentials): Promise<Tokens> => {
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

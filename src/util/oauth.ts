import fetch from 'cross-fetch';
import getLogger from 'debug';
import { DAVCredential } from '../model/davCredential';

const debug = getLogger('tsdav:oauth');

export const fetchOauthTokens = async (
  credential: DAVCredential
): Promise<{
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}> => {
  const param = new URLSearchParams({
    grant_type: 'authorization_code',
    code: credential.authorizationCode,
    redirect_uri: credential.redirectUrl,
    client_id: credential.clientId,
    client_secret: credential.clientSecret,
  });
  const response = await fetch(credential.tokenUrl, {
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
  debug(`: Invalid oauth credentials`);
  return {};
};

export const refreshAccessToken = async (
  credential: DAVCredential
): Promise<{
  access_token?: string;
  expires_in?: number;
}> => {
  const param = new URLSearchParams({
    client_id: credential.clientId,
    client_secret: credential.clientSecret,
    refresh_token: credential.refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(credential.tokenUrl, {
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
  debug(`Fetch oauth tokens failed: Invalid oauth credentials`);
  return {};
};

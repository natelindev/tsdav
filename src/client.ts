import { encode } from 'base-64';
import getLogger from 'debug';

import { DAVCredentials } from './model/davCredentials';
import { DAVRequest, davRequest, DAVResponse } from './request';
import { fetchOauthTokens, refreshAccessToken, Tokens } from './util/oauth';

const debug = getLogger('tsdav:client');
export class DAVClient {
  url: string;

  authHeaders: Headers;

  credentials: DAVCredentials;

  constructor(options: DAVClient) {
    this.authHeaders = new Headers();
    if (options) {
      this.url = options.url;
      this.credentials = options.credentials;
    }
  }

  async basicAuth(credentials: DAVCredentials): Promise<void> {
    this.authHeaders.append(
      'Authorization',
      `Basic ${encode(`${credentials.username}:${credentials.password}`)}`
    );
  }

  async Oauth(credentials: DAVCredentials): Promise<void> {
    if (!credentials.refreshToken) {
      // No refresh token, fetch new tokens
      this.credentials = { ...credentials, ...(await fetchOauthTokens(credentials)) };
    } else if (credentials.refreshToken && !credentials.accessToken) {
      // have refresh token, but no accessToken, fetch access token only
      this.credentials = { ...credentials, ...(await refreshAccessToken(credentials)) };
    } else if (Date.now() > (credentials.expiration ?? 0)) {
      // have both, but accessToken was expired
      this.credentials = { ...credentials, ...(await refreshAccessToken(credentials)) };
    }
    // now we should have valid access token
  }

  async raw(options: DAVRequest): Promise<DAVResponse> {
    return davRequest(this.url, options);
  }
}

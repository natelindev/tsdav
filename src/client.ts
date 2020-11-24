import getLogger from 'debug';
import { encode } from 'base-64';
import { DAVCredential } from './model/davCredential';
import { fetchOauthTokens, refreshAccessToken } from './util/oauth';

const debug = getLogger('tsdav:client');
export class DAVClient {
  serverUrl: string;

  authHeaders: Headers;

  credential: DAVCredential;

  constructor(options: DAVClient) {
    this.authHeaders = new Headers();
    if (options) {
      this.serverUrl = options.serverUrl;
      this.credential = options.credential;
    }
  }

  async basicAuth(credential: DAVCredential): Promise<void> {
    this.authHeaders.append(
      'Authorization',
      `Basic ${encode(`${credential.username}:${credential.password}`)}`
    );
  }

  async Oauth(credential: DAVCredential): Promise<void> {
    if (credential.expiration) this.credential.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      this.credential.refreshToken = tokens.refresh_token;
    }
    if (tokens.expires_in) {
      this.credential.expiration = Date.now() + tokens.expires_in;
    }
  }
}

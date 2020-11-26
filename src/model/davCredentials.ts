export class DAVCredentials {
  username?: string;

  password?: string;

  clientId?: string;

  clientSecret?: string;

  authorizationCode?: string;

  redirectUrl?: string;

  tokenUrl?: string;

  accessToken?: string;

  refreshToken?: string;

  expiration?: number;

  appleId?: string;

  appSpecificPassword?: string;

  constructor(options?: DAVCredentials) {
    if (options) {
      this.username = options.username;
      this.password = options.password;
      this.clientId = options.clientId;
      this.clientSecret = options.clientSecret;
      this.authorizationCode = options.authorizationCode;
      this.redirectUrl = options.redirectUrl;
      this.tokenUrl = options.tokenUrl;
      this.accessToken = options.accessToken;
      this.refreshToken = options.refreshToken;
      this.expiration = options.expiration;
    }
  }
}

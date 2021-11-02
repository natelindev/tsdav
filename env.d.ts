declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CREDENTIAL_ICLOUD_USERNAME: string;
      CREDENTIAL_ICLOUD_APP_SPECIFIC_PASSWORD: string;
      CREDENTIAL_GOOGLE_USERNAME: string;
      CREDENTIAL_GOOGLE_REFRESH_TOKEN: string;
      CREDENTIAL_GOOGLE_CLIENT_ID: string;
      CREDENTIAL_GOOGLE_CLIENT_SECRET: string;
      RECORD_NETWORK_REQUESTS: string;
      MOCK_FETCH: string;
    }
  }
}

export {};

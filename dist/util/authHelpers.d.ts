import { fetch } from 'cross-fetch';
import { DAVTokens } from '../types/DAVTypes';
import { DAVCredentials } from '../types/models';
/**
 * Provide given params as default params to given function with optional params.
 *
 * suitable only for one param functions
 * params are shallow merged
 */
export declare const defaultParam: <F extends (...args: any[]) => any>(fn: F, params: Partial<Parameters<F>[0]>) => (...args: Parameters<F>) => ReturnType<F>;
export declare const getBasicAuthHeaders: (credentials: DAVCredentials) => {
    authorization?: string;
};
export declare const getBearerAuthHeaders: (credentials: DAVCredentials) => {
    authorization?: string;
};
export declare const fetchOauthTokens: (credentials: DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof fetch) => Promise<DAVTokens>;
export declare const refreshAccessToken: (credentials: DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof fetch) => Promise<{
    access_token?: string;
    expires_in?: number;
}>;
export declare const getOauthHeaders: (credentials: DAVCredentials, fetchOptions?: RequestInit, fetchOverride?: typeof fetch) => Promise<{
    tokens: DAVTokens;
    headers: {
        authorization?: string;
    };
}>;

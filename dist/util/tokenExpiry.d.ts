/** Whether a token expiring at `expiration` (ms since epoch) can still be sent. */
export declare const isTokenUnexpired: (expiration: number) => boolean;
/** Expiration timestamp for an OAuth `expires_in`, which some providers send as a string. */
export declare const getTokenExpiration: (expiresIn: unknown) => number | undefined;

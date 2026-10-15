// Refresh a little early so a token cannot expire while a request is in flight.
const EXPIRY_MARGIN_MS = 60_000;

/** Whether a token expiring at `expiration` (ms since epoch) can still be sent. */
export const isTokenUnexpired = (expiration: number): boolean =>
  Date.now() < expiration - EXPIRY_MARGIN_MS;

/** Expiration timestamp for an OAuth `expires_in`, which some providers send as a string. */
export const getTokenExpiration = (expiresIn: unknown): number | undefined => {
  const seconds =
    typeof expiresIn === 'string' && expiresIn.trim() !== '' ? Number(expiresIn) : expiresIn;
  return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
    ? Date.now() + seconds * 1000
    : undefined;
};

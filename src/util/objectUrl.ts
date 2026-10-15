import { ensureTrailingSlash } from './requestHelpers';

/**
 * Resolve a new object's URL from its collection URL and file name.
 *
 * The file name is one path segment, not a relative URL: `?`, `#`, `\`, a
 * stray `%`, and whitespace or control characters are percent-encoded, and the
 * `./` prefix keeps a name like `urn:uuid:1.ics` from parsing as a URL scheme.
 * Valid percent-escapes are kept, so already-encoded names are not encoded twice.
 */
export const getObjectUrl = (collectionUrl: string, filename: string): string => {
  if (!filename || filename.includes('/') || /^(?:\.|%2e){1,2}$/i.test(filename)) {
    throw new Error(`Invalid object filename "${filename}": expected a single path segment`);
  }
  const segment = filename.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: URL parsing strips or trims these.
    /%(?![\da-f]{2})|[?#\\\x00-\x20\x7f]/gi,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );
  return new URL(`./${segment}`, ensureTrailingSlash(collectionUrl)).href;
};

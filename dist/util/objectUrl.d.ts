/**
 * Resolve a new object's URL from its collection URL and file name.
 *
 * The file name is one path segment, not a relative URL: `?`, `#`, `\`, a
 * stray `%`, and whitespace or control characters are percent-encoded, and the
 * `./` prefix keeps a name like `urn:uuid:1.ics` from parsing as a URL scheme.
 * Valid percent-escapes are kept, so already-encoded names are not encoded twice.
 */
export declare const getObjectUrl: (collectionUrl: string, filename: string) => string;

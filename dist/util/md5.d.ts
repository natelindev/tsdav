/**
 * MD5 message digest (RFC 1321), returning a lowercase hex string.
 *
 * HTTP Digest authentication still defaults to MD5, but WebCrypto does not
 * implement it. This small implementation keeps Digest auth portable across
 * Node.js, browsers, Bun, Deno and Workers without adding a dependency.
 * It is only used for the Digest handshake, never for anything that needs
 * collision resistance.
 */
export declare const md5: (input: string) => string;

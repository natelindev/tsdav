/**
 * MD5 message digest (RFC 1321), returning a lowercase hex string.
 *
 * HTTP Digest authentication still defaults to MD5, but WebCrypto does not
 * implement it. This small implementation keeps Digest auth portable across
 * Node.js, browsers, Bun, Deno and Workers without adding a dependency.
 * It is only used for the Digest handshake, never for anything that needs
 * collision resistance.
 */

// Left-rotation amounts, four per round.
const SHIFTS = [
  [7, 12, 17, 22],
  [5, 9, 14, 20],
  [4, 11, 16, 23],
  [6, 10, 15, 21],
];

// K[i] = floor(abs(sin(i + 1)) * 2^32)
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));

const toHex = (word: number): string => {
  let hex = '';
  for (let i = 0; i < 4; i += 1) {
    hex += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
};

export const md5 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  // Pad to a multiple of 64 bytes: 0x80, zeros, then the 64-bit bit length.
  const paddedLength = (((bytes.length + 8) >>> 6) + 1) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;
  const view = new DataView(buffer.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + K[i] + view.getUint32(offset + g * 4, true)) | 0;
      const shift = SHIFTS[i >>> 4][i % 4];
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
};

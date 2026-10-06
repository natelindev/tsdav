import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { md5 } from '../md5';

describe('md5', () => {
  // RFC 1321, appendix A.5 test suite
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'd174ab98d277d9f5a5611c2c9f419d9f',
    ],
    [
      '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
      '57edf4a22be3c955ac49da2e2107b67a',
    ],
  ])('matches the RFC 1321 vector for %j', (input, expected) => {
    expect(md5(input)).toBe(expected);
  });

  it('matches node:crypto across padding boundaries', () => {
    for (let length = 0; length <= 200; length += 1) {
      const input = 'x'.repeat(length);
      expect(md5(input)).toBe(createHash('md5').update(input).digest('hex'));
    }
  });

  it('hashes non-ASCII input as UTF-8', () => {
    const input = 'Grüße, 日本語 🎉';
    expect(md5(input)).toBe(createHash('md5').update(input, 'utf8').digest('hex'));
  });
});

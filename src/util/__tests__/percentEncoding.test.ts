import { describe, expect, it } from 'vitest';

import { normalizePercentEncoding } from '../percentEncoding';

describe('normalizePercentEncoding', () => {
  it.each([
    ['https://h.example/p/a@b.com/', 'https://h.example/p/a%40b.com/'],
    ['https://h.example/p/a%40b.com/', 'https://h.example/p/a%40b.com/'],
    ['https://h.example/cal/my%20event.ics', 'https://h.example/cal/my%20event.ics'],
    ['https://h.example/cal/caf%c3%a9.ics', 'https://h.example/cal/caf%C3%A9.ics'],
    ['https://h.example/cal/urn:uuid:1.ics', 'https://h.example/cal/urn%3Auuid%3A1.ics'],
  ])('encodes %s uniformly', (href, expected) => {
    expect(normalizePercentEncoding(href)).toBe(expected);
  });

  it('keeps an encoded slash inside its segment', () => {
    expect(normalizePercentEncoding('https://h.example/cal/a%2fb.ics')).toBe(
      'https://h.example/cal/a%2Fb.ics',
    );
  });

  it('leaves the query, malformed escapes, and relative hrefs alone', () => {
    expect(normalizePercentEncoding('https://h.example/cal/x.ics?a=%40')).toBe(
      'https://h.example/cal/x.ics?a=%40',
    );
    expect(normalizePercentEncoding('https://h.example/cal/100%.ics')).toBe(
      'https://h.example/cal/100%.ics',
    );
    expect(normalizePercentEncoding('/cal/a@b.ics')).toBe('/cal/a@b.ics');
  });
});

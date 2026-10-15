import { describe, expect, it } from 'vitest';

import { getObjectUrl } from '../objectUrl';

const base = 'https://example.com/cal/home/';

describe('getObjectUrl', () => {
  it.each([
    ['event.ics', 'https://example.com/cal/home/event.ics'],
    ['urn:uuid:1234.ics', 'https://example.com/cal/home/urn:uuid:1234.ics'],
    ['mailto:x.ics', 'https://example.com/cal/home/mailto:x.ics'],
    ['evt#1.ics', 'https://example.com/cal/home/evt%231.ics'],
    ['evt?1.ics', 'https://example.com/cal/home/evt%3F1.ics'],
    ['100%.ics', 'https://example.com/cal/home/100%25.ics'],
    ['a\\b.ics', 'https://example.com/cal/home/a%5Cb.ics'],
    ['line\nbreak.ics', 'https://example.com/cal/home/line%0Abreak.ics'],
    ['trailing.ics ', 'https://example.com/cal/home/trailing.ics%20'],
    ['my event.ics', 'https://example.com/cal/home/my%20event.ics'],
    ['café.ics', 'https://example.com/cal/home/caf%C3%A9.ics'],
  ])('resolves %j as one segment of the collection', (filename, expected) => {
    expect(getObjectUrl(base, filename)).toBe(expected);
  });

  it('keeps names that callers already percent-encoded', () => {
    expect(getObjectUrl(base, `feed-${encodeURIComponent('a@b/c#d')}.ics`)).toBe(
      'https://example.com/cal/home/feed-a%40b%2Fc%23d.ics',
    );
  });

  it('resolves against a collection URL without a trailing slash', () => {
    expect(getObjectUrl('https://example.com/cal/home', 'event.ics')).toBe(
      'https://example.com/cal/home/event.ics',
    );
  });

  it.each(['', '/evil.ics', 'sub/event.ics', '.', '..', '%2e%2E', '.%2e'])(
    'rejects %j, which is not a file name inside the collection',
    (filename) => {
      expect(() => getObjectUrl(base, filename)).toThrow('Invalid object filename');
    },
  );
});

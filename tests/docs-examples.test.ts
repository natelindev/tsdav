import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { rolldown } from 'rolldown';
import ICAL from 'ical.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { convertInput } from '../docs/src/components/ConverterBase';

const example = async (page: string) => {
  const code = readFileSync(resolve(page), 'utf8').match(/```ts\n([\s\S]*?)\n```/)?.[1];
  if (!code) throw new Error(`No TypeScript example in ${page}`);
  const entry = resolve('tests/virtual-example.ts');
  const bundle = await rolldown({
    input: entry,
    platform: 'browser',
    plugins: [
      {
        name: 'documentation-example',
        resolveId(source) {
          if (source === entry) return entry;
          if (source === 'tsdav') return resolve('src/index.ts');
        },
        load(id) {
          if (id === entry) return code;
        },
      },
    ],
  });
  try {
    const { output } = await bundle.generate({ format: 'cjs' });
    const chunk = output.find((item) => item.type === 'chunk');
    if (!chunk) throw new Error('Example produced no code');
    const module = { exports: {} as Record<string, any> };
    runInNewContext(
      chunk.code,
      {
        module,
        exports: module.exports,
        URL,
        URLSearchParams,
        Headers,
        Response,
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
      },
      { filename: `${page} example.js` },
    );
    return module.exports;
  } finally {
    await bundle.close();
  }
};

afterEach(() => vi.unstubAllGlobals());

describe('executable documentation', () => {
  it('converts JSON and preserves XML values without evaluating input', () => {
    expect(
      JSON.parse(
        convertInput(
          'xml',
          '<d:prop xmlns:d="DAV:"><d:displayname>123</d:displayname><d:getetag>A<![CDATA[B]]>C</d:getetag></d:prop>',
        ),
      ).prop,
    ).toMatchObject({ displayname: '123', getetag: 'ABC' });
    expect(JSON.parse(convertInput('prop', '[{"name":"displayname","namespace":"DAV:"}]'))).toEqual(
      { 'd:displayname': {} },
    );
    expect(
      convertInput(
        'xml-reverse',
        '{"d:prop":{"_attributes":{"xmlns:d":"DAV:"},"d:displayname":{"_text":"123"}}}',
      ),
    ).toContain('<d:displayname>123</d:displayname>');
    expect(() => convertInput('prop', '(() => { globalThis.executed = true; })()')).toThrow();
    expect((globalThis as any).executed).toBeUndefined();
  });

  it('imports all-day recurrence and exceptions together, preserves text, and checks HTTP failures', async () => {
    const { importExternalFeed } = await example('docs/docs/caldav/import-ical-feed.md');
    const feed = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Test//EN',
      'BEGIN:VEVENT',
      'UID:a/b',
      'DTSTART;VALUE=DATE:20261001',
      'DTEND;VALUE=DATE:20261002',
      'RRULE:FREQ=DAILY;COUNT=2',
      'SUMMARY:Hello\\, world',
      'DESCRIPTION:First\\nSecond',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:a/b',
      'RECURRENCE-ID;VALUE=DATE:20261002',
      'DTSTART;VALUE=DATE:20261003',
      'DTEND;VALUE=DATE:20261004',
      'SUMMARY:Exception',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
    let uploaded = '';
    let filename = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url, init) => {
        if (!init) return new Response(feed);
        uploaded = String(init.body);
        filename = new URL(url).pathname;
        return new Response('', { status: 201 });
      }),
    );
    expect(
      await importExternalFeed(
        'https://example.com/feed',
        { url: 'https://example.com/calendar/' },
        'Basic test',
      ),
    ).toBe(1);
    const resource = new ICAL.Component(ICAL.parse(uploaded));
    const events = resource.getAllSubcomponents('vevent');
    expect(events).toHaveLength(2);
    expect(events[0].getFirstProperty('dtstart')?.type).toBe('date');
    expect(events[0].getFirstPropertyValue('rrule')?.toString()).toBe('FREQ=DAILY;COUNT=2');
    expect(events[0].getFirstPropertyValue('summary')).toBe('Hello, world');
    expect(events[0].getFirstPropertyValue('description')).toBe('First\nSecond');
    expect(filename).toBe('/calendar/feed-a%2Fb.ics');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(async (_url, init) =>
          init ? new Response('', { status: 412 }) : new Response(feed),
        ),
    );
    await expect(
      importExternalFeed(
        'https://example.com/feed',
        { url: 'https://example.com/calendar/' },
        'Basic test',
      ),
    ).rejects.toThrow('412');
  });

  it('runs the sync guide through login and commits changes and tokens together', async () => {
    const { synchronizeCalendars } = await example('docs/docs/smart calendar sync.md');
    const xml = (body: string) =>
      new Response(
        `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">${body}</d:multistatus>`,
        { status: 207, headers: { 'content-type': 'application/xml' } },
      );
    const member = (href: string, props: string) =>
      `<d:response><d:href>${href}</d:href><d:propstat><d:prop>${props}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url, init) => {
        const body = String(init?.body);
        if (init?.method === 'PROPFIND' && body.includes('current-user-principal'))
          return xml(
            member(
              '/',
              '<d:current-user-principal><d:href>/principal/</d:href></d:current-user-principal>',
            ),
          );
        if (body.includes('calendar-home-set'))
          return xml(
            member(
              '/principal/',
              '<c:calendar-home-set><d:href>/cal/</d:href></c:calendar-home-set>',
            ),
          );
        if (body.includes('resourcetype'))
          return xml(member('/cal/work/', '<d:resourcetype><c:calendar/></d:resourcetype>'));
        if (body.includes('supported-report-set'))
          return xml(member('/cal/work/', '<d:supported-report-set/>'));
        if (body.includes('getctag'))
          return xml(member('/cal/work/', '<cs:getctag>new-ctag</cs:getctag>'));
        if (body.includes('calendar-query')) {
          expect(body).not.toContain('name="VEVENT"');
          return xml(member('/cal/work/task', '<d:getetag>new</d:getetag>'));
        }
        if (body.includes('calendar-multiget'))
          return xml(
            member(
              '/cal/work/task',
              '<d:getetag>new</d:getetag><c:calendar-data>BEGIN:VCALENDAR</c:calendar-data>',
            ),
          );
        return new Response('', { status: 200 });
      }),
    );
    const operations: string[] = [];
    const tx = {
      putCalendar: vi.fn(async (calendar) => {
        expect(calendar.ctag).toBe('new-ctag');
        operations.push('token');
      }),
      removeCalendar: vi.fn(),
      putObject: vi.fn(async () => {
        operations.push('object');
      }),
      removeObject: vi.fn(),
    };
    const store = {
      readCalendars: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(async (work) => work(tx)),
    };
    await synchronizeCalendars(
      'https://example.com/',
      { username: 'test', password: 'test' },
      store,
    );
    expect(operations).toEqual(['object', 'token']);
    expect(store.transaction).toHaveBeenCalledOnce();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    await expect(synchronizeCalendars('https://example.com/', {}, store)).rejects.toThrow();
    expect(store.transaction).toHaveBeenCalledOnce();
  });
});

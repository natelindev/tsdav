const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { execFileSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const directory = mkdtempSync(join(root, 'tests', '.examples-'));
const pages = ['docs/docs/smart calendar sync.md', 'docs/docs/caldav/import-ical-feed.md'];
try {
  const sources = pages.map((page, index) => {
    const markdown = readFileSync(join(root, page), 'utf8');
    const source = markdown.match(/```ts\n([\s\S]*?)\n```/)?.[1];
    if (!source) throw new Error(`No TypeScript example in ${page}`);
    const filename = join(directory, `example-${index}.ts`);
    writeFileSync(filename, source);
    return filename;
  });
  execFileSync(
    'pnpm',
    [
      'exec',
      'tsc',
      '--ignoreConfig',
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--esModuleInterop',
      '--target',
      'ES2018',
      '--lib',
      'ES2019,DOM,DOM.Iterable',
      '--module',
      'preserve',
      '--moduleResolution',
      'bundler',
      ...sources,
    ],
    { cwd: root, stdio: 'inherit' },
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}

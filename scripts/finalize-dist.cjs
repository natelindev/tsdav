const { copyFileSync, mkdirSync, rmSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(process.cwd(), 'dist');

mkdirSync(distDir, { recursive: true });
copyFileSync(join(distDir, 'index.d.ts'), join(distDir, 'tsdav.d.ts'));

for (const file of ['package.json', 'LICENSE', 'README.md']) {
  copyFileSync(file, join(distDir, file));
}

rmSync(join(distDir, 'ts'), { recursive: true, force: true });

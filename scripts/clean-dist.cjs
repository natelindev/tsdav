const { rmSync } = require('node:fs');
const { join } = require('node:path');

rmSync(join(process.cwd(), 'dist'), { recursive: true, force: true });

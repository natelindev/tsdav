const { readdirSync, rmSync } = require('node:fs');

for (const entry of readdirSync(process.cwd())) {
  if (entry.startsWith('dist')) {
    rmSync(entry, { recursive: true, force: true });
  }
}

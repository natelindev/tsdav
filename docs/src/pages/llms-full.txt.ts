import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async () => {
  const docsDir = path.resolve(process.cwd(), 'src/content/docs');

  function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(filePath));
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const files = getAllFiles(docsDir).sort();
  let fullText = `# tsdav Documentation (Full Text for LLMs)\n\nTypeScript WebDAV, CalDAV & CardDAV Client Library.\n\n========================================\n\n`;

  for (const file of files) {
    const rel = path.relative(docsDir, file);
    const content = fs.readFileSync(file, 'utf8');
    fullText += `## File: ${rel}\n\n${content}\n\n----------------------------------------\n\n`;
  }

  return new Response(fullText, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

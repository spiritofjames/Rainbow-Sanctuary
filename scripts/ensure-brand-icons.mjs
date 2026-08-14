import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconTags = [
  '  <link rel="icon" href="./assets/brand/favicon-lotus-64.png?v=20260814-brand1" type="image/png" sizes="64x64">',
  '  <link rel="apple-touch-icon" href="./assets/brand/apple-touch-icon.png?v=20260814-brand1" sizes="180x180">',
  '  <link rel="manifest" href="./site.webmanifest?v=20260814-brand1">',
  '  <meta name="theme-color" content="#5748e8">',
].join('\n');

const verifyOnly = process.argv.includes('--check');
const pages = fs.readdirSync(root).filter((file) => file.endsWith('.dc.html'));
const missing = [];

for (const file of pages) {
  const pathname = path.join(root, file);
  const html = fs.readFileSync(pathname, 'utf8');
  if (html.includes('rel="icon"')) continue;
  missing.push(file);
  if (!verifyOnly) {
    fs.writeFileSync(pathname, html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${iconTags}`));
  }
}

if (verifyOnly && missing.length) {
  console.error(`Missing favicon metadata: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(verifyOnly ? `Verified ${pages.length} pages.` : `Added favicon metadata to ${missing.length} page(s).`);

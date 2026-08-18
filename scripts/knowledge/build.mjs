import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileKnowledge } from './compiler.mjs';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(root, 'content/knowledge');
const previousManifestPath = path.join(root, 'knowledge-build-manifest.json');
const safeGeneratedName = (name) => /^Knowledge(?:-(?:Topic-)?[A-Za-z0-9-]+)?\.dc\.html$/.test(name);
const pagefindWasmFiles = ['wasm.en.pagefind', 'wasm.unknown.pagefind'];

// Pagefind's browser-WASM output differs by the host that builds the same
// pinned Pagefind release. Preserve a committed browser-compatible copy when
// present, so source-controlled builds stay reproducible on macOS, Linux CI,
// and Vercel. A deliberate Pagefind upgrade can update these assets explicitly.
const existingPagefindWasm = new Map();
for (const name of pagefindWasmFiles) {
  try {
    existingPagefindWasm.set(name, await readFile(path.join(root, 'pagefind', name)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

try {
  const previous = JSON.parse(await readFile(previousManifestPath, 'utf8'));
  for (const file of Object.keys(previous.routes || {})) {
    if (safeGeneratedName(file)) await rm(path.join(root, file), { force: true });
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const result = await compileKnowledge({ sourceDir, outputDir: root });

await exec(process.execPath, [path.join(root, 'scripts/knowledge/build-admin.mjs')]);
await exec(path.join(root, 'node_modules/.bin/pagefind'), ['--site', root, '--glob', 'Knowledge-*.dc.html', '--force-language', 'en']);
for (const [name, contents] of existingPagefindWasm) {
  await writeFile(path.join(root, 'pagefind', name), contents);
}
console.log(`Knowledge build complete: ${result.publicArticles.length} public article(s), ${result.excludedDraftCount} excluded draft or archived article(s).`);

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileKnowledge } from './compiler.mjs';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(root, 'content/knowledge');
const previousManifestPath = path.join(root, 'knowledge-build-manifest.json');
const pagefindDir = path.join(root, 'pagefind');
const pagefindInputManifestPath = path.join(root, 'pagefind-build-manifest.json');
const pagefindVersion = '1.5.2';
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
// Discovery metadata and footer links are part of the rendered article source.
// Generate them before Pagefind so its content hash is stable both locally and
// in Linux CI; indexing first makes the next discovery pass alter Pagefind's
// input and leaves a perpetual generated-file diff.
await exec(process.execPath, [path.join(root, 'scripts/publish-discovery-layer.mjs')]);

const pagefindInputHash = createHash('sha256');
for (const name of (await readdir(root)).filter((file) => safeGeneratedName(file)).sort()) {
  pagefindInputHash.update(name);
  pagefindInputHash.update(await readFile(path.join(root, name)));
}
const currentPagefindInputHash = pagefindInputHash.digest('hex');

let canReusePagefind = false;
try {
  const previousPagefindInput = JSON.parse(await readFile(pagefindInputManifestPath, 'utf8'));
  await access(path.join(pagefindDir, 'pagefind-entry.json'));
  canReusePagefind = previousPagefindInput.inputHash === currentPagefindInputHash
    && previousPagefindInput.pagefindVersion === pagefindVersion;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// Pagefind appends versioned index shards when its output directory already
// exists. Rebuild that generated directory from the current articles so stale
// shards cannot affect the entry hash or ship alongside the active index.
if (!canReusePagefind) {
  await rm(pagefindDir, { recursive: true, force: true });
  await exec(path.join(root, 'node_modules/.bin/pagefind'), ['--site', root, '--glob', 'Knowledge-*.dc.html', '--force-language', 'en']);
  for (const [name, contents] of existingPagefindWasm) {
    await writeFile(path.join(pagefindDir, name), contents);
  }
  await writeFile(
    pagefindInputManifestPath,
    `${JSON.stringify({ pagefindVersion, inputHash: currentPagefindInputHash }, null, 2)}\n`
  );
}
console.log(`Knowledge build complete: ${result.publicArticles.length} public article(s), ${result.excludedDraftCount} excluded draft or archived article(s).`);

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('Pagefind indexes only generated article pages', async () => {
  const [build, integrity] = await Promise.all([
    read('scripts/knowledge/build.mjs'),
    read('scripts/release-integrity-check.mjs'),
  ]);

  assert.match(build, /const pagefindGlob = 'Knowledge-\[a-z\]\*\.dc\.html'/);
  assert.match(build, /'--glob', pagefindGlob/);
  assert.match(build, /previousPagefindInput\.glob === pagefindGlob/);
  assert.match(build, /pagefindVersion, glob: pagefindGlob, inputHash/);
  assert.doesNotMatch(build, /'--glob', 'Knowledge-\*\.dc\.html'/);
  assert.match(integrity, /pagefindBuild\.glob !== 'Knowledge-\[a-z\]\*\.dc\.html'/);
  assert.match(integrity, /pagefindEntry\.languages\?\.en\?\.page_count !== knowledge\.entries\.length/);
});

test('search results do not inject Pagefind excerpts as HTML', async () => {
  const search = await read('knowledge-search.js');

  assert.match(search, /escapeHtml\(record\.excerpt\)/);
  assert.doesNotMatch(search, /\$\{record\.excerpt\}/);
});

test('search preserves an accessible empty-query and failure fallback', async () => {
  const [search, page] = await Promise.all([
    read('knowledge-search.js'),
    read('Knowledge-Search.dc.html'),
  ]);

  assert.match(search, /Enter a word or phrase to search approved articles\./);
  assert.match(search, /Search is temporarily unavailable\./);
  assert.match(search, /Browse knowledge topics/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /<noscript>/);
});

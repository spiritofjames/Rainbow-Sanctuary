import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

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

test('search results retain only bare highlights and never inject arbitrary excerpt HTML', async () => {
  const search = await read('knowledge-search.js');
  const context = vm.createContext({});
  vm.runInContext(search.split('const initializeKnowledgeSearch')[0], context);
  const format = value => vm.runInContext(`formatExcerpt(${JSON.stringify(value)})`, context);
  assert.equal(format('A <mark>shared</mark> practice'), 'A <mark>shared</mark> practice');
  assert.equal(format('<img src=x onerror=alert(1)><mark onclick="x">word</mark>'), '&lt;img src=x onerror=alert(1)&gt;&lt;mark onclick=&quot;x&quot;&gt;word</mark>');
  assert.equal(format('&lt;mark&gt;literal&lt;/mark&gt;'), '&amp;lt;mark&amp;gt;literal&amp;lt;/mark&amp;gt;');
  assert.equal(vm.runInContext('resultUrl("/Knowledge-shared-practice-of-life.dc.html")', context), '/knowledge/shared-practice-of-life');
  assert.equal(vm.runInContext('resultUrl("javascript:alert(1)")', context), '/knowledge');
  assert.match(search, /formatExcerpt\(record\.excerpt\)/);
  assert.doesNotMatch(search, /\$\{record\.excerpt\}/);
  assert.match(search, /version !== searchVersion/);
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
  assert.match(page, /knowledge-search\.js\?v=20261108-search-highlights/);
});

test('knowledge pages defer ordered runtime scripts and exclude boilerplate from search', async () => {
  const article = await read('Knowledge-shared-practice-of-life.dc.html');
  for (const file of ['site-config.js', 'support.js']) assert.ok(article.includes(`<script src="/${file}" defer></script>`));
  for (const name of ['crumbs', 'kicker', 'byline', 'source-note', 'toc', 'related']) {
    assert.ok(article.includes(`class="rs-knowledge-${name}" data-pagefind-ignore`), name);
  }
  assert.match(await read('knowledge.css'), /\.rs-knowledge-search-result mark/);
});

test('search initializes after the asynchronous Design Components render', async () => {
  const search = await read('knowledge-search.js');

  assert.match(search, /const initializeKnowledgeSearch = \(form\) =>/);
  assert.match(search, /form\.dataset\.knowledgeSearchReady/);
  assert.match(search, /new MutationObserver\(initializeAvailableSearch\)/);
  assert.match(search, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(search, /^const form = document\.querySelector/m);
});

test('nested knowledge routes resolve the shared site navigation component', async () => {
  const vercel = JSON.parse(await read('vercel.json'));

  assert.ok(vercel.rewrites.some(({ source, destination }) =>
    source === '/knowledge/SiteNavFixed.dc.html' && destination === '/SiteNavFixed.dc.html'));
  assert.ok(vercel.rewrites.some(({ source, destination }) =>
    source === '/knowledge/(.*)/SiteNavFixed.dc.html' && destination === '/SiteNavFixed.dc.html'));
});

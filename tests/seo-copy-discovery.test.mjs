import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const main = file => read(file).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];

test('approved editorial answers and navigation appear in initial HTML', () => {
  const home = main('Home.dc.html');
  const explore = main('Explore.dc.html');
  const library = main('Knowledge.dc.html');
  assert.match(home, /community rooted in Bocas del Toro, Panama/);
  assert.match(home, /Co-Founder of Rainbow Sanctuary/);
  assert.match(home, /href="\/#school">School of the Universe/);
  assert.match(explore, /href="\/events"[^>]*>Events &amp; Retreats calendar/);
  assert.match(library, /href="\/knowledge\/topics\/getting-started">Getting Started/);
  assert.match(read('Explore.dc.html'), /<title>Programs &amp; Events \| Rainbow Sanctuary<\/title>/);
  assert.match(read('Knowledge.dc.html'), /<title>Knowledge Library \| Rainbow Sanctuary<\/title>/);
  assert.match(read('llms.txt'), /Rainbow Sanctuary's co-founder and lead facilitator/);
});

test('ongoing weekly practice is discoverable without offering the expired cycle', () => {
  assert.match(main('Children-Family.dc.html'), /href="\/children-weekly-practice">Explore Children’s Weekly Practice/);
  const practice = main('Kids-Weekly-Practice.dc.html');
  assert.match(practice, /Ongoing weekly practice/);
  assert.match(practice, /Children’s Workshop I or II/);
  assert.match(practice, /href="mailto:hello@rainbowsanctuary\.life\?subject=Children/);
  assert.doesNotMatch(practice, /29 August|14 November|data-kids-weekly-practice-offer/);
  assert.match(read('llms.txt'), /\/children-weekly-practice\)/);
  assert.match(read('markdown/children-weekly-practice.md'), /Ongoing weekly practice/);
});

test('the sitemap reflects the verified main-content revisions', () => {
  const sitemap = read('sitemap.xml');
  for (const route of ['/', '/explore', '/knowledge', '/children-and-family', '/children-weekly-practice']) {
    assert.ok(sitemap.includes(`<loc>https://rainbowsanctuary.life${route}</loc><lastmod>2026-11-26</lastmod>`), route);
  }
});

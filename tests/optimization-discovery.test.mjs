import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mainContentFingerprint, verifiedPageDate, knowledgePageDate } from '../scripts/lib/discovery-dates.mjs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const recordFor = source => ({ updatedAt: '2026-11-07', mainContentSha256: mainContentFingerprint(source), evidence: 'Source-controlled editorial update' });

test('date fingerprints ignore generated head metadata and whitespace, not main content', () => {
  const source = '<head><title>One</title></head><main><h1>Same content</h1><p>Still here.</p></main>';
  const metadataOnly = '<head><title>Two</title></head><main>\n<h1>Same content</h1><p>Still here.</p>\n</main>';
  assert.equal(mainContentFingerprint(source), mainContentFingerprint(metadataOnly));
  assert.equal(verifiedPageDate(metadataOnly, recordFor(source)), '2026-11-07');
  assert.equal(verifiedPageDate(source.replace('Same content', 'Changed content'), recordFor(source)), '');
  assert.equal(verifiedPageDate(source), '');
  assert.equal(mainContentFingerprint('<body>No main landmark</body>'), '');
});

test('invalid date records fail closed instead of emitting misleading sitemap dates', () => {
  const source = '<main>Content</main>';
  for (const change of [{ updatedAt: '2026-02-30' }, { updatedAt: '2026-99-99' }, { mainContentSha256: 'not-a-hash' }, { evidence: '' }]) {
    assert.throws(() => verifiedPageDate(source, { ...recordFor(source), ...change }), /Invalid discovery page-date record/);
  }
});

test('knowledge collection dates derive only from their matching published entries', () => {
  const entries = [
    { canonicalUrl: 'https://rainbowsanctuary.life/knowledge/one', updatedAt: '2026-11-08', topic: { id: 'community' }, tags: [] },
    { canonicalUrl: 'https://rainbowsanctuary.life/knowledge/two', updatedAt: '2026-10-01', topic: { id: 'learning' }, tags: ['long-read'] }
  ];
  assert.equal(knowledgePageDate('/knowledge', entries), '2026-11-08');
  assert.equal(knowledgePageDate('/knowledge/articles', entries), '2026-11-08');
  assert.equal(knowledgePageDate('/knowledge/long-reads', entries), '2026-10-01');
  assert.equal(knowledgePageDate('/knowledge/topics/learning', entries), '2026-10-01');
  assert.equal(knowledgePageDate('/knowledge/two', entries), '2026-10-01');
  assert.equal(knowledgePageDate('/knowledge/topics/unknown', entries), '');
});

test('sitemap dates are source-backed and exclude build-time fallbacks', () => {
  const records = JSON.parse(read('config/discovery-page-dates.json')).pages;
  const config = JSON.parse(read('vercel.json'));
  const manifest = JSON.parse(read('knowledge-build-manifest.json'));
  const sitemap = read('sitemap.xml');
  for (const [, url, modified = ''] of sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    const route = new URL(url).pathname;
    const file = config.rewrites.find(rewrite => rewrite.source === route)?.destination.slice(1);
    assert.ok(file, route);
    const expected = route.startsWith('/knowledge')
      ? knowledgePageDate(route, manifest.entries)
      : verifiedPageDate(read(file), records[route]);
    assert.equal(modified, expected, route);
  }
  assert.doesNotMatch(read('scripts/publish-discovery-layer.mjs'), /const lastmod\s*=|new Date\(\)\.toISOString\(\).*lastmod/);
});

test('published identity and article schema match current content without made-up proof', () => {
  const manifest = JSON.parse(read('knowledge-build-manifest.json'));
  const config = JSON.parse(read('vercel.json'));
  const homeGraph = JSON.parse(read('Home.dc.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const organization = homeGraph.find(node => node['@id'] === 'https://rainbowsanctuary.life/#organization');
  assert.match(organization.description, /growing ecosystem/);
  assert.match(organization.description, /preparing for beta/);
  assert.equal(organization.aggregateRating, undefined);
  for (const entry of manifest.entries) {
    const route = new URL(entry.canonicalUrl).pathname;
    const file = config.rewrites.find(rewrite => rewrite.source === route).destination.slice(1);
    const source = read(file);
    const graph = JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const article = graph.find(node => node['@type'] === 'Article');
    assert.equal(article.articleSection, entry.topic.name);
    assert.equal(article.isPartOf.url, 'https://rainbowsanctuary.life/knowledge');
    assert.equal(article.dateModified, entry.updatedAt);
    assert.match(source, /property="og:type" content="article"/);
  }
  assert.match(read('llms.txt'), /School of the Universe prepares for beta/);
  assert.doesNotMatch(read('llms-full.txt'), /co-founded by Stephanie/);
});

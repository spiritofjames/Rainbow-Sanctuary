import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('vercel.json'));
const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const sourceFor = url => config.rewrites.find(r => r.source === new URL(url).pathname).destination.slice(1);
const graphFor = file => [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph'] || []);

test('public pages reuse verified organization and founder identities without invented claims', () => {
  for (const url of urls) {
    const graph = graphFor(sourceFor(url));
    const organization = graph.find(n => n['@id'] === 'https://rainbowsanctuary.life/#organization');
    const stephanie = graph.find(n => n['@id'] === 'https://rainbowsanctuary.life/about#stephanie-wu');
    assert.match(organization.description, /^Rainbow Sanctuary is a healing academy and global community/);
    assert.deepEqual(organization.sameAs, ['https://www.instagram.com/rainbowsanctuary.life/', 'https://www.trustpilot.com/review/rainbowsanctuary.life']);
    assert.ok(organization.knowsAbout.length >= 3);
    assert.deepEqual(organization.founder, { '@id': stephanie['@id'] });
    assert.equal(stephanie['@type'], 'Person');
    assert.equal(stephanie.url, 'https://rainbowsanctuary.life/about');
    for (const key of ['foundingDate', 'aggregateRating', 'award', 'numberOfEmployees', 'address']) assert.equal(organization[key], undefined);
    assert.equal(stephanie.alumniOf, undefined);
  }
  const about = graphFor('About-Stephanie.dc.html').find(n => n['@type'] === 'AboutPage');
  assert.deepEqual(about.mainEntity, { '@id': 'https://rainbowsanctuary.life/about#stephanie-wu' });
  const article = graphFor('Knowledge-life-from-dust-to-the-stars.dc.html').find(n => n['@type'] === 'Article');
  assert.equal(article.author.url, 'https://rainbowsanctuary.life/about');
  assert.equal(article.author['@id'], about.mainEntity['@id']);
});

test('schema image URLs resolve to packaged first-party files and children sharing uses its visible image', () => {
  function check(value) {
    if (Array.isArray(value)) return value.forEach(check);
    if (!value || typeof value !== 'object') return;
    if (value['@type'] === 'ImageObject' && value.url?.startsWith('https://rainbowsanctuary.life/')) {
      assert.ok(existsSync(path.join(root, new URL(value.url).pathname)), value.url);
    }
    Object.values(value).forEach(check);
  }
  for (const url of urls) graphFor(sourceFor(url)).forEach(check);
  const children = read('Kids-Weekly-Practice.dc.html');
  assert.match(children, /<img src="\.\/assets\/editorial\/family-creative\.jpg"/);
  assert.match(children, /property="og:image" content="https:\/\/rainbowsanctuary.life\/assets\/editorial\/family-creative\.jpg"/);
  assert.match(children, /name="twitter:image" content="https:\/\/rainbowsanctuary.life\/assets\/editorial\/family-creative\.jpg"/);
  assert.doesNotMatch(children, /children-weekly-practice-preparation\.jpg/);
});

test('breadcrumbs describe existing navigation and search action uses the real knowledge search', () => {
  let breadcrumbs = 0;
  for (const url of urls) {
    const file = sourceFor(url);
    const source = read(file);
    const graph = graphFor(file);
    const trail = graph.find(n => n['@type'] === 'BreadcrumbList');
    if (!trail) continue;
    breadcrumbs++;
    assert.match(source, /<nav\b[^>]*aria-label="Breadcrumb"/);
    assert.equal(trail.itemListElement[0].item, 'https://rainbowsanctuary.life/');
    assert.equal(trail.itemListElement.at(-1).item, url);
    trail.itemListElement.forEach((item, i) => { assert.equal(item.position, i + 1); assert.ok(item.name); });
    if (graph.some(n => n['@type'] === 'Article')) {
      assert.equal(trail.itemListElement.length, 4);
      assert.match(trail.itemListElement[2].item, /\/knowledge\/topics\//);
    }
  }
  assert.ok(breadcrumbs > 7);
  const website = graphFor('Home.dc.html').find(n => n['@type'] === 'WebSite');
  assert.equal(website.potentialAction.target.urlTemplate, 'https://rainbowsanctuary.life/knowledge/search?q={search_term_string}');
  assert.match(read('knowledge-search.js'), /params\.get\('q'\)/);
  assert.match(read('Knowledge-Search.dc.html'), /name="robots" content="noindex,follow/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { htmlToMarkdown } from '../scripts/lib/html-to-markdown.mjs';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const home = read('Home.dc.html');
const config = JSON.parse(read('vercel.json'));
const schema = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph']);

test('identity root and programmes doorway are separate canonical routes', () => {
  for (const [route, file] of [['/', '/Home.dc.html'], ['/explore', '/Explore.dc.html'], ['/programs', '/Workshops.dc.html']]) {
    assert.equal(config.rewrites.find(r => r.source === route)?.destination, file);
    assert.ok(read(file.slice(1)).includes(`rel="canonical" href="https://rainbowsanctuary.life${route}"`));
    assert.equal(config.redirects.find(r => r.source === file)?.destination, route);
  }
  assert.match(read('Explore.dc.html'), /Home is where your heart feels peace/);
  assert.match(read('Explore.dc.html'), /data-home-hero-video autoplay muted playsinline/);
  assert.doesNotMatch(home, /<x-dc|<dc-import|<video|support\.js|unpkg|fonts\.googleapis/);
});

test('identity story answers visitor questions as native HTML', () => {
  assert.equal((home.match(/<h1\b/g) || []).length, 1);
  const ids = [...home.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['vision','school','panama','pathways','people','psn','progress','connect']) assert.ok(ids.includes(id));
  for (const text of ['Come home to yourself.','Co-create our future.','From me to we.','preparing for beta','Taking part is always your choice','future goals']) assert.ok(home.includes(text), text);
  for (const name of ['Stephanie','James','Ethel','Chloe']) assert.ok(home.includes('<h3>'+name+'</h3>'),name);
  assert.equal((home.match(/<details><summary>/g) || []).length, 0, 'the repeated FAQ block was removed per the concise copy brief');
  assert.equal((home.match(/<details class="disclosure">/g) || []).length, 5, 'five PDF disclosures');
  assert.doesNotMatch(home, /See the moments<br>behind the vision/, 'no extra narrative section outside the PDF');
});

test('homepage uses the original Bocas coastline and the owner’s Places gallery', () => {
  assert.match(home, /<figure class="coast-hero__photo"><img src="\/assets\/home\/coast-1920\.webp"/);
  assert.match(home, /<figcaption>Bocas surroundings · photograph<\/figcaption>/);
  assert.match(home,/id="places-gallery"/);
  assert.equal((home.match(/<img\b/g)||[]).length,30);
  assert.doesNotMatch(home,/school-concept|site-visualisation|inquiry-mandala/);
  assert.doesNotMatch(home, /★★★★★|TrustScore|aggregateRating|\b20\d\d.*healed/i);
});

test('homepage images have dimensions and the coastline has one matching responsive preload', () => {
  let hero;
  for (const [,tag] of home.matchAll(/(<img\b[^>]*>)/g)) {
    assert.match(tag, /width="\d+"/); assert.match(tag, /height="\d+"/);
    if (tag.includes('/assets/brand/lotus-mark-header.png')) {
      assert.match(tag, /\balt=""/);
      continue; // Decorative mark inside an explicitly named home link.
    }
    assert.match(tag, /\balt="[^"]+"/);
    if (tag.includes('coast-1920.webp')) hero = tag;
    else if (!tag.includes('rainbow-wordmark.png')) assert.match(tag, /loading="lazy"/);
  }
  const head = home.split('</head>')[0];
  assert.equal((head.match(/as="image"/g) || []).length, 1);
  const preload = head.match(/<link\b[^>]*as="image"[^>]*>/)?.[0];
  assert.match(hero, /fetchpriority="high"/);
  assert.doesNotMatch(hero, /loading="lazy"/);
  assert.match(preload, /href="\/assets\/home\/coast-1920\.webp"/);
  assert.equal(preload.match(/ imagesrcset="([^"]+)"/)?.[1], hero.match(/ srcset="([^"]+)"/)?.[1]);
  assert.equal(preload.match(/ imagesizes="([^"]+)"/)?.[1], hero.match(/ sizes="([^"]+)"/)?.[1]);
  assert.ok(fs.statSync(new URL('../assets/home/coast-1920.webp', import.meta.url)).size < 350000);
  assert.ok(fs.statSync(new URL('../assets/home/coast-960.webp', import.meta.url)).size < 110000);
  assert.doesNotMatch(head,/as="font"/,'source design uses native Georgia and system fonts');
});

test('simplified content has no stale FAQ schema and has aligned public project data', () => {
  assert.equal(schema.find(s => s['@type'] === 'FAQPage'),undefined);
  const text = htmlToMarkdown(home, 'https://rainbowsanctuary.life/');
  assert.ok(text.includes('From me to we. From awakening to co-creation.'));
  const copy=JSON.parse(read('content/home/co-create-verbatim.json'));
  const profile=JSON.parse(read('assets/home/co-create-profile.json'));
  assert.equal(profile.description,copy.hero.body);
  assert.deepEqual(profile.team,copy.people.members);
  assert.match(profile.team[0].role,/Founder/);
  assert.match(home,/href="\/assets\/home\/co-create-profile.json"/);
  assert.doesNotMatch(JSON.stringify(profile),/\/Volumes\/|\/Users\//);
  const main=home.match(/<main\b[\s\S]*?<\/main>/)[0];
  assert.ok(htmlToMarkdown(main,'https://rainbowsanctuary.life/').split(/\s+/).filter(Boolean).length<2600,'PDF copy stays concise without editorial additions');
  assert.match(read('markdown/home.md'), /Aerial view of rainforest, a sandy shoreline and turquoise sea in Bocas del Toro, Panama/);
  assert.match(read('markdown/explore.md'), /Awakening Your Inner Light/);
  assert.match(read('llms.txt'), /https:\/\/rainbowsanctuary.life\/explore/);
});

test('legacy deep links are allowlisted and do not affect new homepage sections', () => {
  const js = read('home-identity.js');
  for (const id of ['find-your-path','planetary-vision','contribution-title','review-invitation-title']) assert.ok(js.includes(id));
  assert.match(js, /legacy\.has\(anchor\)/);
  assert.doesNotMatch(js, /fetch\(|https?:\/\//);
  const css = read('home-identity.css');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(read('home-experience.css'), /grid-auto-rows:\d+px/);
  assert.match(home, /<nav class="nav identity-nav" aria-label="Main navigation">/);
});

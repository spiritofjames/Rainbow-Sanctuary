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
  for (const id of ['vision','school','panama','pathways','people','psn','progress','questions','connect','instagram']) assert.ok(ids.includes(id));
  for (const text of ['A new way of living begins with connection','Stephanie Wu, James Stark','School building is in place','preparing for beta','not an announcement of open School enrolment','separate, voluntary pathway','not an open residency, property or investment offer','not a demonstrated system','Twelve functioning nodes is our goal']) assert.ok(home.includes(text), text);
  assert.equal((home.match(/<details><summary>/g) || []).length, 8);
  assert.ok(home.indexOf('id="instagram"') > home.indexOf('id="connect"'));
  assert.ok(home.indexOf('id="instagram"') < home.indexOf('<footer'));
});

test('documentary and generated images have distinct visible disclosures', () => {
  assert.match(home, /Bocas surroundings · photograph/);
  assert.match(home, /AI-assisted visualisation based on a satellite view and our site plan/);
  assert.match(home, /not a surveyed plan or drone photograph/);
  assert.match(home, /Website concept · not a live learning platform/);
  assert.match(home, /imagined people, symbolic connection/);
  assert.match(home, /An artistic expression of the PSN vision/);
  assert.doesNotMatch(home, /★★★★★|TrustScore|aggregateRating|\b20\d\d.*healed/i);
});

test('homepage images have dimensions and only its real coast hero has high priority', () => {
  for (const [,tag] of home.matchAll(/(<img\b[^>]*>)/g)) {
    assert.match(tag, /width="\d+"/); assert.match(tag, /height="\d+"/); assert.match(tag, /\balt="[^"]+"/);
    if (!tag.includes('rainbow-wordmark.png') && !tag.includes('coast-1920.webp')) assert.match(tag, /loading="lazy"/);
  }
  const head = home.split('</head>')[0];
  assert.equal((head.match(/as="image"/g) || []).length, 1);
  assert.match(head, /imagesrcset="[^"]+coast-960.webp 960w/);
  assert.ok(fs.statSync(new URL('../assets/home/coast-1920.webp', import.meta.url)).size < 350000);
  assert.ok(fs.statSync(new URL('../assets/home/school-site-visualisation-1672.webp', import.meta.url)).size < 550000);
  for (const f of ['rainbow-serif.woff2','rainbow-sans.woff2']) assert.ok(fs.statSync(new URL('../assets/home/' + f, import.meta.url)).size < 30000);
});

test('FAQ structured data derives from the same eight visible answers', () => {
  const faq = schema.find(s => s['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 8);
  const text = htmlToMarkdown(home, 'https://rainbowsanctuary.life/');
  const visibleAnswers = [...home.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(([, question, answer]) => ({
    name: question.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(),
    text: answer.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(),
  }));
  assert.deepEqual(faq.mainEntity.map(q => ({ name: q.name, text: q.acceptedAnswer.text })), visibleAnswers);
  for (const q of faq.mainEntity) {
    assert.ok(text.includes(q.name));
  }
  assert.match(read('markdown/home.md'), /AI-assisted visualisation/);
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
  assert.match(css, /grid-auto-rows:auto/);
  assert.match(home, /<details class="mobile-menu"><summary>/);
});

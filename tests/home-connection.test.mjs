import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('Home.dc.html');

test('Shared Pathway contact offers four honest topic-specific email drafts',()=>{
  const contact=home.match(/<section class="closing"[\s\S]*?<\/section>/)[0];
  const links=[...contact.matchAll(/href="(mailto:[^"]+)"/g)].map(m=>m[1]);
  const topicLinks=links.filter(h=>h.includes('?subject='));
  assert.equal(topicLinks.length,4);
  for(const href of topicLinks){const url=new URL(href);assert.equal(url.pathname,'hello@rainbowsanctuary.life');assert.ok(url.searchParams.get('subject'));}
  for(const id of ['families','communities','projects','places'])assert.match(contact,new RegExp('id="connect-'+id+'"'));
  assert.match(contact,/Write to us at/);
  assert.doesNotMatch(contact,/These links open an email draft|A conversation, not a commitment/,'no added contact prose outside the PDF');
  assert.doesNotMatch(contact,/instagram\.com|<form|\/api\//);
  assert.doesNotMatch(home,/<form|href="\/connect|fetch\(/);
  assert.equal((home.match(/href="#connect"/g)||[]).length,2,'one shared navigation link, plus the PDF hero invitation');
});

test('all homepage fragments exist and programmes content is preserved',()=>{
  const ids=new Set([...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,fragment]of home.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(fragment),fragment);
  const main=read('Explore.dc.html').match(/<main[\s\S]*?<\/main>/)[0]
    .replaceAll('/awakening-your-inner-light-Jan-2027','/awakening-your-inner-light-2026')
    .replaceAll('18 to 24 January 2027','3 to 9 December 2026')
    .replaceAll('18–24 January 2027','3–9 December 2026')
    .replaceAll('January 2027','December 2026');
  // Baseline includes the approved ongoing Maintenance promotion (10 November 2026).
  assert.equal(crypto.createHash('sha256').update(main).digest('hex'),'3e6d115c0ce63eadd1c84126a1ebec0825c1a68a2b6d199fbccead825780076a');
});

test('spiritual inquiry and current status boundaries survive discovery generation',()=>{
  for(const file of ['Home.dc.html','markdown/home.md']){
    const text=read(file);assert.match(text,/Taking part is always your choice/);assert.match(text,/still to be built/);
    assert.match(text,/Place descriptions are owner-reported/);assert.match(text,/preparing for beta/i);
    assert.match(text,/future goals/);
  }
  assert.ok(home.indexOf('id="school"')<home.indexOf('id="places"'));
  assert.ok(home.indexOf('id="places"')<home.indexOf('id="horizon"'));
  assert.match(read('llms-full.txt'),/four topic links open email drafts/);
  assert.doesNotMatch(read('llms-full.txt'),/Initial contact uses the official Instagram profile/);
});

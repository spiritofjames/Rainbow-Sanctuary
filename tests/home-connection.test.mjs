import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('Home.dc.html');
test('connection hub has honest Mode A contact and no fake intake',()=>{
  const hub=home.match(/<section class="connection-hub[\s\S]*?<\/section>/)[0];
  assert.equal((hub.match(/<a /g)||[]).length,1);
  assert.match(hub,/href="#contact-invitation"/);
  const contact=home.match(/<section class="contact-invitation[\s\S]*?<\/section>/)[0];
  assert.equal((contact.match(/<a /g)||[]).length,1);
  assert.match(contact,/Message Rainbow on Instagram/);
  assert.match(contact,/This opens our Instagram profile/);
  assert.match(contact,/A conversation, not a commitment/);
  assert.doesNotMatch(hub,/A conversation, not a commitment/);
  for(const id of ['families','communities','projects'])assert.match(hub,new RegExp('id="connect-'+id+'"'));
  assert.doesNotMatch(home,/<form|href="\/connect|fetch\(/);
  assert.equal((home.match(/class="nav-action" href="#connect"/g)||[]).length,2);
});
test('all homepage fragments exist and programmes content is preserved',()=>{
  const ids=new Set([...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,fragment]of home.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(fragment),fragment);
  const main=read('Explore.dc.html').match(/<main[\s\S]*?<\/main>/)[0];
  assert.equal(crypto.createHash('sha256').update(main).digest('hex'),'a185d607eadfb6ac3498b8a97049d87924e1c042dfcc5eaa9e74b99587123841');
});
test('spiritual inquiry remains distinct from demonstrated capabilities in discovery',()=>{
  for(const file of ['Home.dc.html','markdown/home.md']){
    const text=read(file);assert.match(text,/not a demonstrated system/);assert.match(text,/spiritual inquiry, distinct from artificial/);
    assert.match(text,/not a scientific description/);
  }
  assert.ok(home.indexOf('id="school"')<home.indexOf('id="panama"'));
  assert.ok(home.indexOf('id="panama"')<home.indexOf('id="psn"'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {icon} from '../scripts/lib/home-icons.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('Home.dc.html'), css=read('home-experience.css'), js=read('home-identity.js');

test('Shared Pathway design is locally bundled with decorative original glyphs',()=>{
  assert.equal((home.match(/home-experience\.css/g)||[]).length,1);
  assert.match(read('scripts/build-public-site.mjs'),/"home-experience.css"/);
  for(const name of ['arrow','families','communities','projects','technology','place','seed','horizon','message']){
    assert.match(icon(name),/aria-hidden="true"/);assert.match(icon(name),/focusable="false"/);
    assert.doesNotMatch(icon(name),/<script|https?:|<image/);
  }
  assert.equal((home.match(/class="button contact-path-link"/g)||[]).length,4);
  assert.equal((home.match(/class="pathway-card"/g)||[]).length,2);
});

test('deeper reading uses native disclosures without executable reference content',()=>{
  assert.equal((home.match(/class="(?:facts )?disclosure"/g)||[]).length,5);
  const toggles=[...home.matchAll(/<span\b[^>]*class="disclosure-toggle"[^>]*>/g)].map(m=>m[0]);
  assert.equal(toggles.length,5);
  assert.ok(toggles.every(tag=>tag.includes('aria-hidden="true"')));
  assert.match(css,/\.disclosure\[open\] \.disclosure-toggle/);
  assert.match(css,/\.disclosure>summary:focus-visible/);
  const reference=read('content/home/shared-pathway-style-reference.html');
  assert.doesNotMatch(reference,/<script\b|<iframe\b|<form\b|javascript:|onclick=/i);
});

test('masthead changes from transparent to capsule at the cinematic scroll threshold',()=>{
  const events={}, states=[];
  const masthead={toggleAttribute:(name,enabled)=>states.push([name,enabled])};
  const document={querySelector:s=>s==='.coast-masthead'?masthead:null,querySelectorAll:()=>[]};
  const window={location:{hash:''},scrollY:0,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(js,{document,window});
  window.scrollY=25;events.scroll();
  window.scrollY=0;events.pageshow();
  assert.deepEqual(states,[['data-at-top',true],['data-at-top',false],['data-at-top',true]]);
});

test('source styles retain keyboard, contrast and reduced-motion safeguards',()=>{
  for(const token of ['prefers-reduced-motion:reduce','prefers-reduced-transparency:reduce','prefers-contrast:more',':focus-visible'])assert.ok(css.includes(token),token);
  assert.match(css,/\.skip:focus\{z-index:60\}/);
  assert.ok(Buffer.byteLength(css)<32000,'enhancement CSS under32kB');
  assert.ok(Buffer.byteLength(js)<6000,'interaction JS under6kB');
});

test('Places gallery renders all 16 supplied images in numbered order',()=>{
  const places=home.match(/<section[^>]*id="places"[\s\S]*?<\/section>/)[0];
  assert.match(places,/id="places-gallery-track" tabindex="0"/);
  assert.match(places,/aria-label="Previous image"/);
  assert.match(places,/aria-label="Next image"/);
  assert.doesNotMatch(places,/place-photo-pair/);
  assert.deepEqual([...places.matchAll(/src="\/assets\/home\/places-gallery\/(\d+)-720\.webp"/g)].map(m=>Number(m[1])),
    Array.from({length:16},(_,i)=>i+1));
  assert.equal((places.match(/loading="lazy"/g)||[]).length,16);
  for(let n=1;n<=16;n++)for(const w of [720,1440]){
    assert.ok(fs.existsSync(new URL('../assets/home/places-gallery/'+n+'-'+w+'.webp',import.meta.url)));
  }
});

test('contribution section shows the shared future illustration above its cards',()=>{
  const needs=home.match(/<section[^>]*id="needs"[\s\S]*?<\/section>/)?.[0];
  assert.match(needs,/<figure class="needs-illustration">[\s\S]*?shared-future-1440\.webp[\s\S]*?Artistic vision[\s\S]*?<\/figure><div class="roadmap needs-grid">/);
});

test('School uses the source chapter surface and exact PDF pathway cards',()=>{
  const school=home.match(/<section class="section" id="school"[\s\S]*?<\/section>/)[0];
  assert.match(school,/class="story-columns learning-pathways"/);
  assert.match(school,/A school for coming home<br>to who we are\./,'retain source School headline composition');
  assert.doesNotMatch(school,/school-concept\.webp/);
  assert.match(school,/class="school-symbol"><img src="\/assets\/home\/noya-rao-school-rainbow\.webp"[^>]*><\/figure>/);
  for(const text of ['Young people and families','Adults:','consent of their parents','forty years of practice behind it'])assert.ok(school.includes(text),text);
  assert.doesNotMatch(school,/school-invitations|not open enrolment/,'the PDF copy is not supplemented with rewritten prose');
});

test('core team matches Shared Pathway and preserves truthful visual descriptions',()=>{
  const team=home.match(/<section class="section" id="people"[\s\S]*?<\/section>/)[0];
  for(const name of ['stephanie','james','ethel','chloe']){
    const photo=team.match(new RegExp('<img[^>]*src="/assets/home/team/aligned/'+name+'\\.jpg"[^>]*>'))?.[0];
    assert.match(photo,/width="900" height="1200"/);
    assert.ok(fs.existsSync(new URL('../assets/home/team/aligned/'+name+'.jpg',import.meta.url)));
  }
  assert.doesNotMatch(team,/stephanie-photo/);
  assert.doesNotMatch(team,/Hanan|Retreat facilitator|team-connections/);
  assert.doesNotMatch(home,/inquiry-mandala|instagram-copy/);
});

test('closing artwork is identified as an illustration and sits above the contact buttons',()=>{
  const closing=home.match(/<section[^>]*id="connect"[\s\S]*?<\/section>/)?.[0];
  assert.match(closing,/<figure class="connection-visual">[\s\S]*?connection-living-world-v2\.webp[\s\S]*?Artistic vision · imagined people, symbolic connection across places\.[\s\S]*?<\/figure><div class="connect-grid">/);
});

test('the coastal masthead preserves the current hero and fades away over the sea',()=>{
  const header=home.match(/<header class="coast-masthead">[\s\S]*?<\/header>/)?.[0];
  assert.match(header,/href="#connect">Connect with Us<\/a>/);
  assert.doesNotMatch(header,/<details|<button/);
  const websiteLink=/<a class="masthead-website" href="\/explore">Programs &amp; Events <span aria-hidden="true">→<\/span><\/a>/g;
  assert.equal([...header.matchAll(websiteLink)].length,1);
  assert.equal([...header.matchAll(/<a\b/g)].length,3,'brand home link and two always-visible actions');
  const hero=home.match(/<section class="hero coast-hero"[\s\S]*?<\/section>/)?.[0];
  assert.match(hero,/<h1 id="hero-title">Come home to yourself\.<br>Co-create our future\.<\/h1>/);
  assert.match(hero,/href="#story">Discover our purpose ↓<\/a>/);
  assert.match(hero,/href="#connect">Explore co-creation<\/a>/);
  const fade=css.match(/\.coast-hero__photo::after\{[^}]*linear-gradient\(90deg,[^}]*\}/)?.[0];
  assert.match(fade,/rgb\(var\(--hero-forest\) \/ 0\) 88%\)/);
  assert.match(css,/\.coast-hero__photo img\{[^}]*object-fit:cover/);
  assert.doesNotMatch(css.match(/\.coast-hero__photo img\{[^}]*\}/)?.[0],/\bfilter:/);
  assert.match(css,/linear-gradient\(180deg,rgb\(var\(--hero-forest\)\) 0%/);
});

test('hero gives the floating header room without a fixed content height',()=>{
  assert.doesNotMatch(read('home-identity.css'),/body::before/,'no decorative rainbow strip above the hero');
  assert.match(css,/padding-block-start:max\(8\.5rem,calc\(6\.5rem \+ env\(safe-area-inset-top,0px\)\)\)/);
  const mobile=css.slice(css.indexOf('@media(max-width:54rem)'));
  assert.match(mobile,/\.coast-hero__copy\{[^}]*padding-block-start:calc\(7\.25rem \+ env\(safe-area-inset-top,0px\)\)/);
  assert.match(mobile,/\.hero\.coast-hero\{[^}]*min-block-size:0/);
  assert.match(home,/home-experience\.css\?v=20261107-square-hero-top/);
  assert.match(css,/border-radius:0 0 2rem 2rem/,'desktop hero has square top and rounded bottom corners');
  assert.match(mobile,/\.hero\.coast-hero\{[^}]*border-radius:0 0 1\.5rem 1\.5rem/,'mobile retains only bottom rounding');
});

test('exact source styles, typography and glyphs are locally reproducible',()=>{
  assert.equal(read('home-identity.css'),read('content/home/shared-pathway-style.css'));
  assert.ok(css.startsWith(read('content/home/shared-pathway-visuals.css').trimEnd()));
  const mastheadFonts=[...css.matchAll(/@font-face\{font-family:(SanctuaryMasthead\w+);src:url\('([^']+)'\)[^}]*\}/g)];
  assert.equal(mastheadFonts.length,2);
  assert.equal((css.match(/@font-face/g)||[]).length,mastheadFonts.length);
  for(const [,family,path] of mastheadFonts){
    assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)),path);
    const usages=css.replace(/@font-face\{[^}]*\}/g,'').match(new RegExp('[^{}]+\\{[^{}]*'+family+'[^{}]*\\}','g'));
    assert.equal(usages?.length,1);
    assert.match(usages[0],/\.coast-masthead/);
  }
  const reference=read('content/home/shared-pathway-style-reference.html');
  const sourceGlyphs=new Set([...reference.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(m=>m[0]));
  for(const [glyph]of home.matchAll(/<svg\b[\s\S]*?<\/svg>/g))assert.ok(sourceGlyphs.has(glyph),'no approximate replacement glyphs');
});

test('navigation clears stale chapter labels and maps contact invitation to Connect',()=>{
  let notify;
  const links=[{hash:'#vision'},{hash:'#connect'}].map(a=>({...a,setAttribute:(key,value)=>a.current=value,removeAttribute:()=>a.current=null,state:a}));
  const chapters=[{id:'psn',getBoundingClientRect:()=>({top:100,bottom:900})},{id:'contact-invitation',getBoundingClientRect:()=>({top:1000,bottom:2000})}];
  const document={querySelector:()=>null,querySelectorAll:s=>s.startsWith('.identity-nav')?links:s==='main section[id]'?chapters:[]};
  const IntersectionObserver=class{constructor(cb){notify=cb}observe(){}};
  vm.runInNewContext(js,{document,IntersectionObserver,window:{location:{hash:''},innerHeight:1000,IntersectionObserver:true}});
  notify();assert.ok(links.every(a=>a.state.current===null));
  chapters[0].getBoundingClientRect=()=>({top:-1000,bottom:-100});chapters[1].getBoundingClientRect=()=>({top:100,bottom:900});
  notify();assert.equal(links[1].state.current,'location');assert.equal(links[0].state.current,null);
});

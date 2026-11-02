import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {icon} from '../scripts/lib/home-icons.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('Home.dc.html'), css=read('home-experience.css'), js=read('home-identity.js');

test('editorial enhancement is locally bundled and all original glyphs are decorative',()=>{
  assert.equal((home.match(/home-experience\.css/g)||[]).length,1);
  assert.match(read('scripts/build-public-site.mjs'),/"home-experience.css"/);
  for(const name of ['arrow','families','communities','projects','seed','horizon','copy','message']){
    assert.match(icon(name),/aria-hidden="true"/);
    assert.match(icon(name),/focusable="false"/);
    assert.doesNotMatch(icon(name),/<script|https?:|<image/);
  }
  assert.equal((home.match(/class="audience-symbol"/g)||[]).length,3);
  assert.equal((home.match(/class="progress-symbol"/g)||[]).length,3);
});

test('copy helpers are progressive enhancements with a polite status and no intake',()=>{
  assert.equal((home.match(/data-copy-message hidden/g)||[]).length,3);
  assert.match(css,/\.copy-starter\[hidden\]\{display:none\}/);
  assert.match(home,/class="copy-status" role="status" aria-live="polite"/);
  assert.match(js,/button\.hidden=false/);
  assert.match(js,/navigator\.clipboard\.writeText\(message\)/);
  assert.doesNotMatch(js,/fetch\(|localStorage|setInterval|https?:/);
});

test('menu closes on Escape and restores focus without requiring a motion library',()=>{
  const events={}, menu={open:true,contains:()=>false,addEventListener:(n,f)=>events['menu:'+n]=f,querySelector:()=>({focus:()=>events.focused=true})};
  const document={querySelector:s=>s==='.mobile-menu'?menu:null,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f};
  vm.runInNewContext(js,{document,window:{location:{hash:''}}});
  events.keydown({key:'Escape'});assert.equal(menu.open,false);assert.equal(events.focused,true);
  menu.open=true;events['menu:click']({target:{closest:()=>({})}});assert.equal(menu.open,false);
  menu.open=true;events.click({target:{}});assert.equal(menu.open,false);
});

test('motion, transparency, keyboard and short-screen fallbacks are present',()=>{
  for(const token of ['prefers-reduced-motion:reduce','prefers-reduced-transparency:reduce','prefers-contrast:more',':focus-visible','100dvh - 120px','overscroll-behavior:contain'])assert.ok(css.includes(token),token);
  assert.match(css,/nav-action\[aria-current="location"\]\{color:#fff/);
  assert.match(css,/\.skip:focus\{z-index:60\}/);
  assert.match(css,/\.copy-starter\{[^}]*min-height:44px/);
  assert.ok(Buffer.byteLength(css)<32000,'enhancement CSS under 32 kB');
  assert.ok(Buffer.byteLength(js)<6000,'interaction JS under 6 kB');
});

test('additional imagery reuses approved photos with honest captions and dimensions',()=>{
  const bridge=home.match(/<div class="shared-bridge[\s\S]*?<\/div><\/figure><\/div>/)?.[0] || home.slice(home.indexOf('class="shared-bridge'),home.indexOf('id="school"'));
  assert.match(bridge,/a past gathering/);
  assert.match(bridge,/shared-reflection-1200.webp/);
  assert.match(bridge,/forest-walk-1200.webp/);
  assert.equal((bridge.match(/loading="lazy"/g)||[]).length,3);
  assert.equal((bridge.match(/width="1200" height="\d+"/g)||[]).length,3);
});

test('School, PSN and programmes read heading then visual then explanatory copy',()=>{
  for(const id of ['school','psn','pathways']){
    const section=home.match(new RegExp('<section class="image-chapter wrap" id="'+id+'">[\\s\\S]*?<\\/section>'))[0];
    assert.ok(section.indexOf('</h2>')<section.indexOf('<figure'));
    assert.ok(section.indexOf('</figure>')<section.indexOf('class="chapter-body"'));
  }
  assert.match(css,/\.arrival\{position:relative;isolation:isolate;display:flex/);
  assert.match(css,/\.arrival \.coast \.media-frame\{height:100%;border-radius:0/);
});

test('new inquiry, progress and people visuals stay labelled and first-party',()=>{
  assert.match(home,/Artistic interpretation · a spiritual inquiry, not a demonstrated technology/);
  assert.match(home,/Shared practice at a past gathering/);
  for(const name of ['stephanie-wu','james-stark','hanan-perea'])assert.match(home,new RegExp(name+'-1080x1920.webp'));
  assert.match(home,/connecting lines are symbolic/);
  assert.match(home,/class="instagram-glyph"/);
  assert.doesNotMatch(home,/instagram-ivory-gold.webp/);
  assert.match(css,/instagram-copy h2\{[^}]*color:#15382c/);
});

test('navigation clears stale chapter labels and maps the contact invitation to Connect',()=>{
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

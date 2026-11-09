import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

function galleryHarness(reducedMotion = false) {
  const events = {}, trackEvents = {}, calls = [];
  let layoutReads = 0;
  const slides = [0, 300, 600, 900].map(offset => ({ get offsetLeft() { layoutReads++; return offset; } }));
  const button = () => ({ attrs: {}, events: {}, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener(name, fn) { this.events[name] = fn; } });
  const previous = button(), next = button(), status = { textContent: '' };
  const controls = { hidden: true, querySelectorAll: () => [previous, next], querySelector: () => status };
  const track = {
    children: slides, clientWidth: 600, scrollWidth: 1200, scrollLeft: 0,
    addEventListener(name, fn) { trackEvents[name] = fn; },
    scrollTo(options) { calls.push(options); this.scrollLeft = options.left; trackEvents.scroll(); },
  };
  const gallery = { querySelector: selector => selector === '.places-gallery-track' ? track : controls };
  const document = { querySelector: selector => selector === '.places-gallery' ? gallery : null, querySelectorAll: () => [] };
  const window = { location: { hash: '' }, matchMedia: () => ({ matches: reducedMotion }), addEventListener(name, fn) { events[name] = fn; } };
  vm.runInNewContext(read('home-identity.js'), { document, window, setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
  return { track, trackEvents, events, previous, next, status, controls, calls, layoutReads: () => layoutReads };
}

test('gallery end position selects the final slide even when snap positions tie', () => {
  const h = galleryHarness();
  assert.equal(h.status.textContent, '1 / 4');
  assert.equal(h.controls.hidden, false);
  h.trackEvents.keydown({ key: 'End', preventDefault() {} });
  assert.equal(h.calls.at(-1).left, 600);
  assert.equal(h.status.textContent, '4 / 4');
  assert.equal(h.next.attrs['aria-disabled'], 'true');
  h.previous.events.click();
  assert.equal(h.calls.at(-1).left, 300, 'Previous skips a tied end position rather than getting stuck');
  assert.equal(h.next.attrs['aria-disabled'], 'false');
  h.trackEvents.keydown({ key: 'Home', preventDefault() {} });
  assert.equal(h.status.textContent, '1 / 4');
  assert.equal(h.previous.attrs['aria-disabled'], 'true');
});

test('gallery scrolling and navigation reuse cached geometry until a resize', () => {
  const h = galleryHarness();
  const baseline = h.layoutReads();
  h.next.events.click();
  h.next.events.click();
  h.previous.events.click();
  h.trackEvents.scroll();
  assert.equal(h.layoutReads(), baseline, 'scroll updates should not read slide offsets');
  h.track.clientWidth = 300;
  h.events.resize();
  assert.ok(h.layoutReads() > baseline, 'resize refreshes the responsive snap geometry');
  h.trackEvents.keydown({ key: 'End', preventDefault() {} });
  assert.equal(h.calls.at(-1).left, 900);
  assert.equal(h.status.textContent, '4 / 4');
});

test('gallery keeps reduced-motion navigation and ignores modified shortcuts', () => {
  const h = galleryHarness(true);
  h.next.events.click();
  assert.equal(h.calls.at(-1).behavior, 'instant');
  const count = h.calls.length;
  h.trackEvents.keydown({ key: 'End', ctrlKey: true, preventDefault() { assert.fail('modified key intercepted'); } });
  assert.equal(h.calls.length, count);
  h.events.pageshow();
  assert.equal(h.status.textContent, '2 / 4');
});

test('identity homepage retains lightweight native interactions and deferred media', () => {
  const home = read('Home.dc.html');
  const images = [...home.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
  assert.ok(images.length >= 20);
  assert.equal(images.filter(tag => /fetchpriority="high"/.test(tag)).length, 1);
  for (const tag of images) {
    assert.match(tag, /\bwidth="[1-9]\d*"/);
    assert.match(tag, /\bheight="[1-9]\d*"/);
    if (!/fetchpriority="high"|lotus-mark-header/.test(tag)) assert.match(tag, /loading="lazy"/);
  }
  assert.match(home, /home-identity\.js[^>]* defer/);
  assert.doesNotMatch(home, /<iframe\b|<video\b|fonts\.googleapis\.com/);
  assert.ok(Buffer.byteLength(read('home-identity.js')) < 6000);
});

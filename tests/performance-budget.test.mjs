import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const bytes = (file) => statSync(new URL(`../${file}`, import.meta.url)).size;
const home = read("Home.dc.html");
const retreat = read("Awakening-Your-Inner-Light-2026.dc.html");

test("hero image requests are discoverable early without preloading below-fold media", () => {
  for (const [html, image, budget] of [
    [home, "assets/video/home-sanctuary-shore-v3-poster.jpg", 220_000],
    [retreat, "assets/editorial/retreat-preparation-panama.jpg", 450_000],
  ]) {
    const head = html.slice(0, html.indexOf("</head>"));
    const imagePreloads = [...head.matchAll(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/g)];
    assert.equal(imagePreloads.length, 1, "one image priority hint per page");
    assert.ok(imagePreloads[0][0].includes(`href="./${image}"`));
    assert.match(imagePreloads[0][0], /fetchpriority="high"/);
    assert.ok(bytes(image) <= budget, `${image} stays within its existing byte budget`);
  }
  assert.match(home, /poster="\.\/assets\/video\/home-sanctuary-shore-v3-poster\.jpg"/);
  assert.match(read("retreat-event.css"), /url\('\.\/assets\/editorial\/retreat-preparation-panama\.jpg'\)/);
});

test("homepage below-fold images defer loading and provide intrinsic dimensions", () => {
  const images = [...home.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(images.length >= 10);
  for (const image of images) {
    assert.match(image, /loading="lazy"/, image);
    assert.match(image, /\bwidth="[1-9]\d*"/, image);
    assert.match(image, /\bheight="[1-9]\d*"/, image);
  }
  assert.match(home, /min-height: max\(640px, 100svh\)/, "the hero keeps promotional images below the first viewport");
  assert.match(home, /home-spiral-editorial\.jpg"[^>]*width="1003" height="1568"/);
  assert.match(home, /home-family-editorial\.jpg"[^>]*width="1003" height="1568"/);
  assert.match(home, /home-community-editorial\.jpg"[^>]*width="1122" height="1402"/);
  assert.match(home, /trustpilot-review-invitation\.jpg"[^>]*width="736" height="736"/);
});

test("homepage does not load an unused image-slot editor runtime", () => {
  assert.doesNotMatch(home, /image-slot\.js|<image-slot\b/);
  const imports = [...home.matchAll(/<dc-import\b[^>]*name="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(imports, ["SiteNavCinematic"]);
  assert.doesNotMatch(read("SiteNavCinematic.dc.html"), /image-slot|<(?:dc|x)-import\b/);
});

test("performance changes preserve the approved video and audio loading behaviour", () => {
  assert.match(home, /<video\b[^>]*data-home-hero-video autoplay muted playsinline preload="metadata"/);
  assert.match(home, /home-sanctuary-shore-v3-mobile\.mp4" media="\(max-width: 700px\)"/);
  assert.match(home, /home-sanctuary-shore-v3-desktop\.mp4"/);
  assert.match(retreat, /<audio\b[^>]*preload="none"/);
  assert.doesNotMatch(retreat, /<iframe\b[^>]*src="https:\/\/(?:www\.youtube|open\.spotify)/);
});

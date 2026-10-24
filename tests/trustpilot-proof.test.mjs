import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("homepage hero links directly to the correct independent review profile", () => {
  const home = read("Home.dc.html");
  const link = home.match(/<a class="rs-hero-reviews"[\s\S]*?<\/a>/)?.[0];
  assert.ok(link, "hero review link exists in HTML without JavaScript");
  assert.match(link, /href="https:\/\/www\.trustpilot\.com\/review\/rainbowsanctuary\.life"/);
  assert.match(link, /target="_blank" rel="noopener noreferrer"/);
  assert.match(link, /aria-label="Read our reviews on Trustpilot \(opens in a new tab\)"/);
  assert.match(link, /Read our reviews on <strong>Trustpilot<\/strong>/);
  assert.doesNotMatch(link, /\shidden(?:\s|>)|<img|<iframe|<script|5\/5|TrustScore|★★★★★|reviewCount/);
  assert.ok(home.indexOf('class="rs-hero-reviews"') > home.indexOf('class="rs-hero-actions"'));
  assert.ok(home.indexOf('class="rs-hero-reviews"') < home.indexOf("<!-- ONLINE AND REMOTE PATHWAYS -->"));
});

test("the obsolete configurable star badge cannot expose placeholder or stale ratings", () => {
  const home = read("Home.dc.html");
  assert.doesNotMatch(home, /trustpilot-proof\.js|data-trustpilot-|rs-hero-trustproof|★★★★★/);
  assert.doesNotMatch(read("site-config.js"), /trustpilot\s*:/);
  assert.equal(existsSync(new URL("../trustpilot-proof.js", import.meta.url)), false);
  assert.doesNotMatch(home, /widget\.trustpilot\.com|trustpilot-widget/);
});

test("review link has a visible focus treatment and touch-sized responsive layout", () => {
  const home = read("Home.dc.html");
  const styles = home.match(/\.rs-hero-reviews \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(styles);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /max-width: 100%/);
  assert.match(styles, /box-sizing: border-box/);
  assert.match(styles, /color: #173e30/);
  assert.match(home, /\.rs-hero-reviews:focus-visible \{ outline: 3px solid #d9d4ff; outline-offset: 4px; \}/);
  assert.match(home, /\.rs-hero-reviews \{ gap: 8px; margin-top: 18px; padding: 10px 15px; font-size: 12px; \}/);
});

test("review collection remains separate, optional, and neutral", () => {
  const invitation = read("review/index.html");
  assert.match(read("Home.dc.html"), /href="\/review">Leave an honest review/);
  assert.match(invitation, /https:\/\/www\.trustpilot\.com\/evaluate\/rainbowsanctuary\.life/);
  assert.match(invitation, /honest review/i);
  assert.match(read("docs/TRUSTPILOT-REVIEW-COLLECTION.md"), /automation remains disabled/);
});

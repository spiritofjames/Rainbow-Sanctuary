import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = name => readFile(new URL("../" + name, import.meta.url), "utf8");

test("Karma uses the shared offer price card with one honest private-session price", async () => {
  const page = await source("Personal-Karma-Reconciliation.dc.html");
  const card = page.match(/<div class="rs-offer-price-card rs-offer-price-card--single"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(card, "The hero should use the same price-card family as Spiral III");
  assert.match(card, /aria-label="Personal Karma Reconciliation pricing"/);
  assert.match(card, /<small>Private session<\/small><strong>USD 500<\/strong>/);
  assert.equal((card.match(/class="rs-price-standard"/g) || []).length, 1);
  assert.doesNotMatch(card, /rs-price-early-bird|data-early-bird|rs-price-deadline|data-price-key|<a\b|<button\b/);
  assert.doesNotMatch(page, /Early Bird|Deadline to be announced/);
  assert.doesNotMatch(page, /<span class="rs-button" data-price-key="personal-karma-reconciliation"/);
  assert.match(await source("site-config.js"), /"personal-karma-reconciliation": "USD 500 per private session"/);
});

test("the single-price variant removes the unused column without changing the shared price styling", async () => {
  const css = await source("offer-experience.css");
  assert.match(css, /\.rs-offer-price-card--single\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);\s*\}/);
  assert.match(css, /\.rs-offer-price-card\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*auto\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*430px\)\s*\{\s*\.rs-offer-price-card\s*\{\s*width:\s*100%/);
});

test("Spiral III retains its existing two-price card and Karma keeps the approved booking actions", async () => {
  const spiral = await source("Spiral-III.dc.html");
  assert.match(spiral, /data-early-bird-key="spiral-iii"/);
  assert.match(spiral, /class="rs-price-early-bird"/);
  assert.doesNotMatch(spiral, /rs-offer-price-card--single/);
  const karma = await source("Personal-Karma-Reconciliation.dc.html");
  assert.equal((karma.match(/>Book this session<\/a>/g) || []).length, 2);
  assert.match(karma, /reason=private-healing&amp;session=karma/);
  assert.match(karma, /reason=other&amp;program=personal-karma-reconciliation/);
});

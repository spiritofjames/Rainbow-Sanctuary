import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("ReGeneration-Maintenance-Ongoing.dc.html");
const overview = read("144-Stages-Maintenance.dc.html");
const paymentLink = "https://buy.stripe.com/aFa9AT6bL8OFcHP9EL3Nm0r";
const sandbox = { window: {} };
// Evaluate the public data declaration without running unrelated DOM initialisers.
const configSource = read("site-config.js");
const initialiserStart = configSource.indexOf("(function loadPersonaFaqSystem()");
assert.ok(initialiserStart > 0);
vm.runInNewContext(configSource.slice(0, initialiserStart), sandbox);
const config = sandbox.window.RAINBOW_SANCTUARY_CONFIG;

test("Maintenance has one current monthly subscription with a direct Stripe link", () => {
  assert.equal((page.match(/class="rs-entry-price-card rs-maintenance-price-card"/g) || []).length, 1);
  assert.ok(page.includes(`href="${paymentLink}"`));
  assert.match(page, /Subscribe to ongoing Maintenance/);
  assert.match(page, /<strong><span>\$<\/span>110<\/strong><span>USD<small>per month<\/small>/);
  assert.match(page, /Two remote collective Maintenance sessions per month/);
  assert.doesNotMatch(page, /data-maintenance-(?:checkout|offer|status)|regeneration-maintenance-checkout\.js/);
  assert.doesNotMatch(page, /<span>\$<\/span>(?:210|630)|opening cycle is live|live since 17 August|One-time payment; not an automatic subscription/i);
});

test("Maintenance explains eligibility, opt-in, recurring billing and remote delivery", () => {
  assert.match(page, /completed ReGeneration Level I and Level II and their initial 4-Monday or 12-Monday Maintenance cycle/);
  assert.match(page, /does not automatically enrol you or start a subscription/);
  assert.match(page, /recurring monthly subscription, not a one-time payment/);
  assert.match(page, /Review the price, renewal and cancellation terms in Stripe before confirming/);
  assert.match(page, /no Zoom room, call, check-in, or live attendance required/i);
  assert.match(page, /Contact our team for the current session dates/);
  assert.doesNotMatch(page, /reminder (?:arrives|is sent)|cancel anytime|guaranteed|cure/i);
  assert.match(page, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(page, /href="\/wellbeing-disclaimer"/);
});

test("public config and programme promotion match the current subscription", () => {
  const subscription = config.events.regenerationMaintenance;
  assert.equal(subscription.checkoutUrl, paymentLink);
  assert.equal(subscription.billing, "monthly-subscription");
  assert.equal(subscription.overviewUrl, "/144-stages-maintenance");
  assert.equal(subscription.ongoingUrl, "/regeneration-maintenance-ongoing");
  assert.equal(subscription.price, "USD 110 per month");
  assert.match(subscription.frequency, /Two remote collective sessions per month/);
  assert.match(config.pricing["regeneration-maintenance"], /USD 110 per month/);
  const promotion = read("Explore.dc.html").split('class="rs-home-promo rs-home-promo--maintenance')[1].split("</a>")[0];
  assert.match(promotion, /Two remote sessions per month · USD 110 monthly/);
  assert.match(promotion, /After your initial Maintenance cycle/);
  assert.doesNotMatch(promotion, /Live now|17 August|210|630/);
  assert.match(promotion, /href="\/regeneration-maintenance-ongoing"/);
});

test("Maintenance overview preserves completed opening cycles and links to ongoing support", () => {
  assert.match(overview, /4-Monday opening cycle/);
  assert.match(overview, /12-Monday opening cycle/);
  assert.match(overview, /<span>\$<\/span>210/);
  assert.match(overview, /<span>\$<\/span>630/);
  assert.match(overview, /Completed your cycle\?/);
  assert.match(overview, /href="\/regeneration-maintenance-ongoing">Explore ongoing support/);
  assert.match(overview, /Completed cycle · registration closed/);
  assert.doesNotMatch(overview, /data-maintenance-offer|data-maintenance-checkout|regeneration-maintenance-checkout\.js|opening cycle is live/i);
  assert.match(page, /href="\/144-stages-maintenance">← View the Maintenance overview/);
});

test("the new ongoing route is packaged with a legacy redirect and existing noindex policy", () => {
  const routes = JSON.parse(read("vercel.json"));
  assert.ok(routes.rewrites.some(r => r.source === "/regeneration-maintenance-ongoing" && r.destination === "/ReGeneration-Maintenance-Ongoing.dc.html"));
  assert.ok(routes.redirects.some(r => r.source === "/ReGeneration-Maintenance-Ongoing.dc.html" && r.destination === "/regeneration-maintenance-ongoing" && r.permanent));
  assert.doesNotMatch(read("sitemap.xml"), /<loc>https:\/\/rainbowsanctuary\.life\/regeneration-maintenance-ongoing<\/loc>/);
  assert.match(page, /rel="canonical" href="https:\/\/rainbowsanctuary.life\/regeneration-maintenance-ongoing"/);
});

test("completed opening cycle and private schedule retain their historical dates", () => {
  const opening = config.events.items.find((item) => item.id === "regeneration-maintenance-2026-08-17");
  assert.equal(opening.ongoing, false);
  assert.notEqual(opening.status, "open");
  assert.equal(opening.startDateTime, "2026-08-17T23:00:00+08:00");
  assert.equal(opening.activeThrough, "2026-11-02");
  const schedule = config.events.privateSchedules["144-stages-maintenance"];
  assert.equal(schedule.firstCycle.sessions, 12);
  assert.equal(schedule.firstCycle.endsOn, "2026-11-02");
  assert.equal(schedule.afterFirstCycle.status, "requires-team-approved-dates");
});

test("the subscription card has scoped responsive and keyboard-focus styling", () => {
  const css = read("supported-pathways.css");
  assert.match(css, /\.rs-regeneration-page \.rs-maintenance-price-cards--ongoing\{grid-template-columns:minmax\(0,1fr\);max-width:620px\}/);
  assert.match(css, /rs-maintenance-price-cards--ongoing \.rs-maintenance-price-card__action\{box-sizing:border-box/);
  assert.match(css, /rs-maintenance-price-card__action:focus-visible\{outline:3px solid/);
});

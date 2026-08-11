import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), "utf8");

test("supported pathways use Beijing as the only authored source time", () => {
  const config = read("site-config.js");
  assert.match(config, /timezone: "Asia\/Shanghai"/);
  assert.match(config, /autism-family-support-2026-08-18/);
  assert.match(config, /2026-08-18T23:00:00\+08:00/);
  assert.match(config, /young-people-wellbeing-2026-09-01/);
  assert.match(config, /144-stages-maintenance-2026-08-17/);
  assert.match(config, /firstCycle: \{ frequency: "weekly", sessions: 13 \}/);
});

test("sensitive pathways stay safely gated and contributions use approved Stripe checkout", () => {
  const autism = read("Autism-Family-Support.dc.html");
  const youth = read("Young-People-Wellbeing.dc.html");
  const contribution = read("Contribute.dc.html");
  const maintenance = read("144-Stages-Maintenance.dc.html");
  assert.match(autism, /Our exploratory framework/i);
  assert.match(autism, /not final answers or promises of a particular outcome/i);
  assert.match(autism, /does not diagnose, treat, cure, or promise neurological changes/i);
  assert.match(autism, /Complete the free weekly registration/i);
  assert.match(autism, /photo, name, age, and country/i);
  assert.match(autism, /no Zoom link or live attendance requirement/i);
  assert.match(autism, /data-supported-apply="\/apply\?reason=family&amp;program=autism-family-support"/);
  assert.match(youth, /reviewed first/i);
  assert.match(youth, /not a crisis or emergency service/i);
  assert.match(contribution, /https:\/\/donate\.stripe\.com\/fZuaEXeIh1mdazHeZ53Nm00/);
  assert.match(contribution, /Every contribution is voluntary/i);
  assert.match(contribution, /does not reserve a place/i);
  assert.doesNotMatch(contribution, /data-donation-form/);
  assert.doesNotMatch(contribution, /donation-selector\.js/);
  assert.match(read("scripts\/publish-discovery-layer.mjs"), /"Contribute\.dc\.html": "\/contribute"/);
  assert.match(read("api\/stripe\/create-donation-checkout.mjs"), /STRIPE_DONATION_CHECKOUT_APPROVED/);
  assert.match(maintenance, /accepted participants only/i);
});

test("homepage promotional mosaic alternates wide and compact desktop cards without separate section spacing", () => {
  const home = read("Home.dc.html");
  assert.equal((home.match(/class="rs-home-promotions"/g) || []).length, 1);
  assert.match(home, /rs-home-promo--retreat rs-home-promo--wide/);
  assert.match(home, /rs-home-promo--group-healing rs-home-promo--compact/);
  assert.match(home, /rs-home-promo--autism rs-home-promo--compact/);
  assert.match(home, /rs-home-promo--youth rs-home-promo--wide/);
  assert.match(home, /grid-template-columns: repeat\(3, minmax\(0,1fr\)\)/);
  assert.match(home, /\.rs-home-promo--wide \{ grid-column: span 2; \}/);
});

test("supported session selection separates the date, format and registration action", () => {
  const scheduler = read("supported-pathway-scheduler.js");
  const styles = read("supported-pathways.css");
  assert.match(scheduler, /hour12:true/);
  const siteConfig = read("site-config.js");
  assert.match(siteConfig, /11:00 PM Beijing time \(UTC\+8\)/);
  assert.match(siteConfig, /10:00 PM Beijing time/);
  assert.match(scheduler, /rs-supported-session-time/);
  assert.match(scheduler, /rs-supported-session-format/);
  assert.match(styles, /Selected supported-pathway sessions need a clearly scannable date/);
  assert.match(styles, /rs-supported-session-summary\{margin:30px/);
});

test("Group Healing uses the same selected date and format hierarchy", () => {
  const scheduler = read("group-healing-scheduler.js");
  const styles = read("group-journey.css");
  assert.match(scheduler, /rs-group-session-time/);
  assert.match(scheduler, /rs-group-session-format/);
  assert.match(scheduler, /hour12:true/);
  assert.match(styles, /rs-group-session-time/);
});

test("every rendered site footer offers a contribution pathway", () => {
  const pages = fs.readdirSync(root)
    .filter((name) => name.endsWith(".dc.html"))
    .map((name) => [name, read(name)])
    .filter(([, source]) => /<footer\b/i.test(source));
  assert.ok(pages.length >= 38);
  for (const [name, source] of pages) {
    const footer = source.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
    assert.match(footer, /href=["']\/contribute["']/, `${name} footer should link to contributions`);
  }
});

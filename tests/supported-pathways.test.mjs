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

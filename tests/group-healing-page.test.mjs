import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../Group-Healing.dc.html", import.meta.url), "utf8");
const siteConfig = await readFile(new URL("../site-config.js", import.meta.url), "utf8");
const scheduler = await readFile(new URL("../group-healing-scheduler.js", import.meta.url), "utf8");

test("Group Healing overview keeps the approved USD 22 total inside its direct-booking flow", () => {
  assert.match(page, /Online Group Healing/);
  assert.match(page, /<strong>\$22 USD<\/strong>/);
  assert.match(page, /Payment is completed securely through Stripe\./);
  assert.doesNotMatch(page, /aria-label="20 US dollars"/);
  assert.doesNotMatch(page, /\$20 USD/);
});

test("Group Healing owns its Checkout return notice so cancelled returns do not stack alerts", () => {
  assert.ok(siteConfig.includes('window.location.pathname.replace(/\\/$/, "") === "/group-healing"'));
  assert.match(scheduler, /rs-checkout-return/);
  assert.match(scheduler, /Dismiss checkout notice/);
});

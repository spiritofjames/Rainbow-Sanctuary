import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../Group-Healing.dc.html", import.meta.url), "utf8");
const siteConfig = await readFile(new URL("../site-config.js", import.meta.url), "utf8");
const scheduler = await readFile(new URL("../group-healing-scheduler.js", import.meta.url), "utf8");

test("Group Healing presents the approved USD 22 total consistently", () => {
  assert.match(page, /aria-label="22 US dollars"/);
  assert.match(page, /<span aria-hidden="true">\$<\/span>22/);
  assert.match(page, /USD <small>total<\/small>/);
  assert.match(page, /Payment processing is included\./);
  assert.doesNotMatch(page, /aria-label="20 US dollars"/);
  assert.doesNotMatch(page, /<span aria-hidden="true">\$<\/span>20/);
});

test("Group Healing owns its Checkout return notice so cancelled returns do not stack alerts", () => {
  assert.ok(siteConfig.includes('window.location.pathname.replace(/\\/$/, "") === "/group-healing"'));
  assert.match(scheduler, /rs-checkout-return/);
  assert.match(scheduler, /Dismiss checkout notice/);
});

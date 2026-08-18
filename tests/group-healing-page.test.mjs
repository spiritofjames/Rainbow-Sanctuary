import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const overview = await readFile(new URL("../Group-Healing.dc.html", import.meta.url), "utf8");
const onlinePage = await readFile(new URL("../Online-Group-Healing.dc.html", import.meta.url), "utf8");
const siteConfig = await readFile(new URL("../site-config.js", import.meta.url), "utf8");
const scheduler = await readFile(new URL("../group-healing-scheduler.js", import.meta.url), "utf8");

test("Group Healing is a separate overview with pathways, Q&A, and an enquiry CTA", () => {
  assert.match(overview, /Four focused pathways/);
  assert.match(overview, /Questions &amp; answers/);
  assert.match(overview, /Ask a question/);
  assert.match(overview, /href="\/apply\?reason=group-healing-question"/);
  assert.doesNotMatch(overview, /id="group-calendar-grid"/);
  assert.doesNotMatch(overview, /group-healing-scheduler\.js/);
});

test("Online Group Healing owns the calendar, USD 22 checkout, and return notice", () => {
  assert.match(onlinePage, /id="group-calendar-grid"/);
  assert.doesNotMatch(onlinePage, /public-event-feed\.js/);
  assert.match(onlinePage, /<strong>\$22 USD<\/strong>/);
  assert.match(onlinePage, /Payment is completed securely through Stripe\./);
  assert.doesNotMatch(onlinePage, /aria-label="20 US dollars"/);
  assert.doesNotMatch(onlinePage, /\$20 USD/);
  assert.ok(siteConfig.includes('window.location.pathname.replace(/\\/$/, "") === "/online-group-healing"'));
  assert.match(scheduler, /rs-checkout-return/);
  assert.match(scheduler, /Dismiss checkout notice/);
  assert.match(scheduler, /function selectDate\(id\)/);
  assert.match(scheduler, /function weeklySessions\(\)/);
  assert.match(scheduler, /selectSession\(id\);/);
  assert.doesNotMatch(scheduler, /data-group-time/);
  assert.doesNotMatch(onlinePage, /Choose an available time/);
  assert.match(onlinePage, /Select a date and its session time is selected automatically/);
});

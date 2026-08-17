import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../Group-Healing.dc.html", import.meta.url), "utf8");
const scheduler = await readFile(new URL("../group-healing-scheduler.js", import.meta.url), "utf8");
const config = await readFile(new URL("../site-config.js", import.meta.url), "utf8");

test("Group Healing presents the approved USD 22 total consistently", () => {
  assert.match(page, /aria-label="22 US dollars"/);
  assert.match(page, /<span aria-hidden="true">\$<\/span>22/);
  assert.match(page, /USD <small>total<\/small>/);
  assert.match(page, /Payment processing is included\./);
  assert.doesNotMatch(page, /aria-label="20 US dollars"/);
  assert.doesNotMatch(page, /<span aria-hidden="true">\$<\/span>20/);
});

test("Group Healing calendar is isolated to its dedicated weekly schedule", () => {
  assert.doesNotMatch(page, /public-event-feed\.js/);
  assert.match(page, /Tuesday, 18 August at 9:00 PM Asia\/Makassar \/ Beijing time \(GMT\+8\)/);
  assert.match(config, /group-healing-2026-08-18/);
  assert.match(config, /startDate: "2026-08-25"/);
  assert.match(config, /frequency: "Weekly"/);
  assert.match(config, /weeklySchedule:/);
  assert.match(scheduler, /function applyDedicatedSchedule\(\)/);
  assert.match(scheduler, /Do not use `RAINBOW_PUBLIC_EVENTS_READY` here/);
  assert.doesNotMatch(scheduler, /function applyFeed\(/);
});

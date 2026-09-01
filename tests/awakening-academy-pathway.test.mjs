import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), "utf8");

test("Awakening Academy publishes a single parent-led route from discovery to ongoing practice", () => {
  const family = read("Children-Family.dc.html");
  const academy = read("Unlock-The-Potential.dc.html");
  const programmes = read("Workshops.dc.html");
  const foundation = read("Awakening-Academy-Foundation.dc.html");
  const levelOne = read("Awakening-Academy-Level-1.dc.html");
  const levelTwo = read("Awakening-Academy-Level-2.dc.html");
  const routes = read("scripts/publish-discovery-layer.mjs");
  const vercel = read("vercel.json");

  assert.match(family, /Explore the 4-Day Foundation/);
  assert.match(family, /Awakening Academy/);
  assert.match(family, /See the whole Academy pathway/);
  assert.match(family, /Click any stage below to read about it/);
  assert.match(family, /href="\/awakening-academy-level-1"/);
  assert.match(family, /href="\/awakening-academy-level-2"/);
  assert.match(family, /href="\/unlock-the-potential#certificate"/);
  assert.match(family, /href="\/unlock-the-potential#ongoing-practice"/);
  assert.match(family, /Children’s Potential Coach Certification is professional adult training/);
  assert.match(academy, /4-Day Foundation Journey/);
  assert.match(academy, /Parent review/);
  assert.match(academy, /Certificate of Accomplishment/);
  assert.match(academy, /regular practice, creative projects, and co-creation/);
  assert.match(academy, /id="certificate"/);
  assert.match(academy, /id="ongoing-practice"/);
  assert.match(academy, /not an academic, therapeutic, professional, or practitioner qualification/i);
  assert.match(academy, /\/awakening-academy-level-1/);
  assert.match(academy, /\/awakening-academy-level-2/);
  assert.match(programmes, /Children’s Academy roadmap/);
  assert.match(programmes, /href="\/awakening-academy-level-1"/);
  assert.match(programmes, /href="\/awakening-academy-level-2"/);
  assert.match(programmes, /Ongoing practice &amp; community/);
  assert.match(foundation, /children ages 5–15/i);
  assert.match(foundation, /Ages 5–10/);
  assert.match(foundation, /Ages 11–15/);
  assert.match(foundation, /Live online worldwide/i);
  assert.match(foundation, /The inner screen/);
  assert.match(foundation, /Blindfold perception and the living world/);
  assert.match(foundation, /Intuitive sensing and creative intelligence/);
  assert.match(foundation, /Energy, boundaries, and integration/);
  assert.match(foundation, /brief, seated, voluntary blindfold-perception activity/);
  assert.match(foundation, /No walking, navigation, obstacles, darkness, or pressure to continue/);
  assert.match(foundation, /\/apply\?reason=family&amp;program=awakening-academy-foundation/);
  assert.match(levelOne, /Build a grounded language for inner experience/);
  assert.match(levelOne, /readiness recommendation/);
  assert.match(levelOne, /Intuitive object sensing/);
  assert.match(levelOne, /psychometry/);
  assert.match(levelTwo, /Certificate of Accomplishment/);
  assert.match(levelTwo, /does not promise particular abilities/i);
  assert.match(levelTwo, /Telekinesis and materialization/);
  assert.match(levelTwo, /not requirements, performances, guarantees, or scientific validation/);
  assert.match(academy, /Practice in plain language/);
  assert.match(academy, /Are telekinesis or materialization guaranteed/);
  assert.match(routes, /"Awakening-Academy-Foundation\.dc\.html": "\/awakening-academy-foundation"/);
  assert.match(routes, /"Awakening-Academy-Level-1\.dc\.html": "\/awakening-academy-level-1"/);
  assert.match(routes, /"Awakening-Academy-Level-2\.dc\.html": "\/awakening-academy-level-2"/);
  assert.match(vercel, /"source": "\/awakening-academy-foundation"/);
  assert.match(vercel, /"source": "\/awakening-academy-level-1"/);
  assert.match(vercel, /"source": "\/awakening-academy-level-2"/);
});

test("Awakening Academy pages keep educational claims bounded", () => {
  const sources = [
    read("Children-Family.dc.html"),
    read("Unlock-The-Potential.dc.html"),
    read("Awakening-Academy-Foundation.dc.html"),
    read("Awakening-Academy-Level-1.dc.html"),
    read("Awakening-Academy-Level-2.dc.html")
  ].join("\n");

  assert.doesNotMatch(sources, /guaranteed psychic/i);
  assert.doesNotMatch(sources, /photographic memory/i);
  assert.doesNotMatch(sources, /out-of-body travel/i);
  assert.doesNotMatch(sources, /diagnos(?:e|is) or treat/i);
  assert.doesNotMatch(sources, /guaranteed telekinesis/i);
  assert.doesNotMatch(sources, /scientifically proven/i);
  assert.match(sources, /does not diagnose, treat, or replace/i);
});

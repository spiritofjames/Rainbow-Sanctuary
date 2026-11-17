import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const base = "assets/retreats/awakening-inner-light-december-2026/";

test("participant privacy replacement removes identifying public references", () => {
  for (const file of ["Awakening-Your-Inner-Light-2026.dc.html", "markdown/awakening-your-inner-light-Jan-2027.md"]) {
    const text = read(file);
    assert.doesNotMatch(text, /\bIvan\b|testimonials\/ivan\.jpg|herb-ritual-(?:360|720)\.jpg/i);
    assert.match(text, /Alex/);
    assert.doesNotMatch(text, /Name changed for privacy\. AI-generated portrait; not the participant’s likeness\./);
    assert.match(text, /herb-ritual-privacy-720\.jpg/);
  }
  for (const file of ["testimonials/ivan.jpg", "journey/herb-ritual-360.jpg", "journey/herb-ritual-720.jpg"]) {
    assert.equal(existsSync(new URL(`../${base}${file}`, import.meta.url)), false, `${file} must not remain publicly packaged`);
  }
  for (const file of ["testimonials/alex.jpg", "journey/herb-ritual-privacy-360.jpg", "journey/herb-ritual-privacy-720.jpg"]) {
    assert.equal(existsSync(new URL(`../${base}${file}`, import.meta.url)), true);
  }
});

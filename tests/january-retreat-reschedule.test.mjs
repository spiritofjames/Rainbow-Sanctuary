import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizePublicIntake } from "../api/_lib/crm-intake.mjs";

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const route = "/awakening-your-inner-light-Jan-2027";
const program = "awakening-inner-light-january-2027";

test("the actual public catalogue schedules the retreat for all seven January days", () => {
  const context = { window: {} };
  vm.runInNewContext(read("site-config.js").split("(function loadPersonaFaqSystem")[0], context);
  const config = context.window.RAINBOW_SANCTUARY_CONFIG;
  const events = config.events.items;
  const retreat = events.find(event => event.id === program);
  assert.ok(retreat);
  assert.equal(retreat.startDate, "2027-01-18");
  assert.equal(retreat.endDate, "2027-01-24");
  assert.equal(retreat.registrationUrl, route);
  assert.equal(retreat.price, "USD 3,500 per person");
  assert.equal(events.some(event => event.id === "awakening-inner-light-december-2026"), false);
});

test("new and previously shared links lead to one January canonical page", () => {
  const config = JSON.parse(read("vercel.json"));
  for (const source of ["/awakening-your-inner-light-2026", "/awakening-your-inner-light-jan-2027", "/Awakening-Your-Inner-Light-2026.dc.html"]) {
    const redirect = config.redirects.find(item => item.source === source);
    assert.equal(redirect?.destination, route, source);
    assert.equal(redirect.permanent, true);
  }
  assert.equal(config.rewrites.find(item => item.source === route)?.destination, "/Awakening-Your-Inner-Light-2026.dc.html");
  assert.ok(read("sitemap.xml").includes(`https://rainbowsanctuary.life${route}</loc>`));
  assert.doesNotMatch(read("sitemap.xml"), /awakening-your-inner-light-2026<\/loc>/);
  assert.match(read(`markdown${route}.md`), /18–24 January 2027/);
});

test("active website copy and AI discovery agree on January, without rewriting October history", () => {
  for (const file of ["Awakening-Your-Inner-Light-2026.dc.html", "Explore.dc.html", "Book-Consultation.dc.html", "data/december-retreat-faqs.json", "llms.txt", "llms-full.txt"]) {
    const source = read(file);
    assert.match(source, /18–24 January 2027/, file);
    // Asset filenames retain their provenance and are not visible event dates.
    assert.doesNotMatch(source, /3–9 December 2026|December retreat|retreat · December 2026/, file);
  }
  const archive = read("Awakening-Your-Inner-Light-October-2026.dc.html");
  assert.match(archive, /Past retreat · 1–7 October 2026/);
  assert.match(archive, /"startDate":"2026-10-01"/);
  assert.ok(archive.includes(route));
});

test("an old December enquiry link resolves to January without altering its source attribution", () => {
  const sourcePage = "/apply?reason=events&program=awakening-inner-light-december-2026&intent=discovery-call";
  const input = {
    clientEventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
    name: "Synthetic January Visitor", email: "january@example.test", whatsapp: "+507 6000 0000",
    message: "Please tell me about the rescheduled retreat.", reason: "events",
    privacyAccepted: true, privacyPolicyVersion: "13 July 2026",
    program: "awakening-inner-light-december-2026", sourcePage,
    submittedAt: "2026-11-06T12:00:00.000Z"
  };
  const result = normalizePublicIntake(input, new Date("2026-11-06T12:01:00.000Z"));
  assert.equal(result.program, program);
  assert.equal(result.sourcePage, sourcePage);
});

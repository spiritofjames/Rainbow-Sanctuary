import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizePublicIntake } from "../api/_lib/crm-intake.mjs";
import { mirrorHubSpotIntake } from "../api/_lib/hubspot-intake.mjs";
import {
  enquiryOperationsMessage,
  visitorIntakeReceipt
} from "../api/_lib/operations-notification.mjs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const retreatIntake = {
  area: "events",
  displayName: "Synthetic Retreat Visitor",
  email: "retreat-visitor@example.test",
  eventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
  occurredAt: "2026-10-13T12:00:00.000Z",
  phone: "+507 6000 0000",
  program: "awakening-inner-light-december-2026",
  requestMessage: "I would like to understand the December retreat.",
  sourcePage: "/apply?reason=events&program=awakening-inner-light-december-2026"
};

test("December retreat is the active lead journey and carries no expired October checkout", () => {
  const page = read("Awakening-Your-Inner-Light-2026.dc.html");
  const styles = read("retreat-event.css");
  assert.match(page, /3–9 December 2026/);
  assert.match(page, /7 days · 6 nights/);
  assert.match(page, /program=awakening-inner-light-december-2026/);
  assert.match(page, /stephanie-wu\.webp/);
  assert.match(page, /data-gallery-state="awaiting-approved-content"/);
  assert.match(page, /Venue details shared after enquiry/);
  assert.doesNotMatch(page, /book\.stripe\.com/);
  assert.doesNotMatch(page, /Book Early Bird|Book at Standard Rate|1–7 October 2026 in Bocas del Toro/);
  assert.match(styles, /\.rs-retreat-section\[id\]\{scroll-margin-top:132px\}/);
});

test("October retreat is preserved as a completed factual archive without active conversion links", () => {
  const archive = read("Awakening-Your-Inner-Light-October-2026.dc.html");
  assert.match(archive, /Past retreat · 1–7 October 2026/);
  assert.match(archive, /Bocas del Toro, Panama/);
  assert.match(archive, /Status<\/span><strong>Completed/);
  assert.match(archive, /href="\/awakening-your-inner-light-2026"/);
  assert.match(archive, /awaiting-approved-content/);
  assert.doesNotMatch(archive, /book\.stripe\.com|Book now|Reserve your place/);
});

test("event catalogue exposes only the December retreat as upcoming", () => {
  const config = read("site-config.js");
  assert.match(config, /id: "awakening-inner-light-december-2026"/);
  assert.match(config, /startDate: "2026-12-03"/);
  assert.match(config, /endDate: "2026-12-09"/);
  assert.match(config, /Investment shared after enquiry/);
  assert.doesNotMatch(config, /id: "awakening-inner-light-2026"[\s\S]{0,400}startDate: "2026-10-01"/);
});

test("retreat enquiry form pre-fills the exact event and posts programme context", () => {
  const form = read("Book-Consultation.dc.html");
  assert.match(form, /3–9 December 2026/);
  assert.match(form, /this\.state\.program \|\| undefined/);
  assert.match(form, /Retreat interest received/);
  assert.match(form, /not an acceptance, place reservation, or payment request/);
});

test("December enquiry normalizes into the governed HubSpot intake contract", () => {
  const normalized = normalizePublicIntake({
    clientEventId: retreatIntake.eventId,
    email: retreatIntake.email,
    message: retreatIntake.requestMessage,
    name: retreatIntake.displayName,
    privacyAccepted: true,
    privacyPolicyVersion: "13 July 2026",
    program: retreatIntake.program,
    reason: "events",
    sourcePage: retreatIntake.sourcePage,
    submittedAt: retreatIntake.occurredAt,
    whatsapp: retreatIntake.phone
  }, new Date("2026-10-13T12:01:00.000Z"));
  assert.equal(normalized.area, "events");
  assert.equal(normalized.program, "awakening-inner-light-december-2026");
  assert.equal(normalized.sourcePage, retreatIntake.sourcePage);
});

test("HubSpot note, team notification and visitor acknowledgement use the canonical December label", async () => {
  const environment = {
    HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough",
    HUBSPOT_INTAKE_ENABLED: "true",
    HUBSPOT_OWNER_ID: "166816652",
    HUBSPOT_PORTAL_ID: "246920029"
  };
  const calls = [];
  await mirrorHubSpotIntake(retreatIntake, environment, async (url, options) => {
    calls.push({ body: JSON.parse(options.body), url });
    if (url.endsWith("contacts/batch/upsert")) {
      return { json: async () => ({ results: [{ id: "41003" }] }), ok: true, status: 200 };
    }
    return { ok: true, status: 201 };
  });
  assert.equal(calls.length, 2);
  assert.match(calls[1].body.properties.hs_note_body, /Awakening Your Inner Light — 3–9 December 2026/);
  assert.match(calls[1].body.properties.hs_note_body, /program=awakening-inner-light-december-2026/);

  const hubspot = {
    contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/41003",
    enabled: true
  };
  const operations = enquiryOperationsMessage(retreatIntake, hubspot, {
    RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life"
  });
  assert.match(operations.subject, /Awakening Your Inner Light — 3–9 December 2026/);
  assert.doesNotMatch(operations.text, /I would like to understand/);

  const receipt = visitorIntakeReceipt(retreatIntake);
  assert.equal(receipt.alias, "rs-enquiry-received");
  assert.equal(receipt.to, retreatIntake.email);
  assert.deepEqual(receipt.variables, {
    ENQUIRY_TOPIC: "Awakening Your Inner Light — 3–9 December 2026",
    NAME: retreatIntake.displayName,
    REFERENCE_ID: retreatIntake.eventId
  });
});

test("discovery generator describes the active and completed retreat truthfully", () => {
  const discovery = read("scripts/publish-discovery-layer.mjs");
  assert.match(discovery, /startDate: "2026-12-03"/);
  assert.match(discovery, /endDate: "2026-12-09"/);
  assert.match(discovery, /Awakening-Your-Inner-Light-October-2026\.dc\.html/);
  assert.match(discovery, /EventCompleted/);
  assert.match(discovery, /final venue, programme and investment details are confirmed/);
});

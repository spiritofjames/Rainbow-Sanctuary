import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { forwardWebsiteIntake, normalizePublicIntake } from "../api/_lib/crm-intake.mjs";

const submission = {
  clientEventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
  email: "visitor@example.test",
  message: "I would like to understand the next workshop.",
  name: "Generated Visitor",
  privacyAccepted: true,
  privacyPolicyVersion: "13 July 2026",
  reason: "workshop",
  sourcePage: "/apply?reason=workshop",
  submittedAt: "2026-08-04T10:00:00.000Z",
  whatsapp: "+1 555 123 4567"
};
const receivedAt = new Date("2026-08-04T10:02:00.000Z");

test("public enquiry becomes the exact minimal CRM contract", () => {
  assert.deepEqual(normalizePublicIntake(submission, receivedAt), {
    area: "workshop",
    displayName: "Generated Visitor",
    email: "visitor@example.test",
    eventId: submission.clientEventId,
    followUpAt: "2026-08-05T10:00:00.000Z",
    occurredAt: "2026-08-04T10:00:00.000Z",
    pathway: "program",
    phone: "+1 555 123 4567",
    preferredContact: "whatsapp",
    privacyAcceptedAt: "2026-08-04T10:00:00.000Z",
    privacyPolicyVersion: "13 July 2026",
    program: null,
    requestMessage: "I would like to understand the next workshop.",
    schemaVersion: "rainbow.website-intake.v2",
    sourcePage: "/apply?reason=workshop"
  });
});

test("programme context survives the public enquiry URL and reaches the CRM", () => {
  const contextual = normalizePublicIntake({
    ...submission,
    reason: "spiral",
    sourcePage: "/apply?reason=spiral&program=spiral-i"
  }, receivedAt);
  assert.equal(contextual.area, "spiral");
  assert.equal(contextual.pathway, "program");
  assert.equal(contextual.program, "spiral-i");
});

test("private healing and unsafe or unconsented submissions fail closed", () => {
  assert.throws(() => normalizePublicIntake({ ...submission, reason: "private-healing" }, receivedAt), /private healing/i);
  assert.throws(() => normalizePublicIntake({ ...submission, privacyAccepted: false }, receivedAt), /consent/i);
  assert.throws(() => normalizePublicIntake({ ...submission, message: "card=4242 4242 4242 4242" }, receivedAt), /prohibited/i);
  assert.throws(
    () => normalizePublicIntake({ ...submission, submittedAt: "2026-08-03T09:59:59.000Z" }, new Date("2026-08-04T10:00:00.000Z")),
    /timestamp/i
  );
});

test("the same browser submission produces an identical CRM payload on retry", () => {
  assert.deepEqual(
    normalizePublicIntake(submission, new Date("2026-08-04T10:00:05.000Z")),
    normalizePublicIntake(submission, new Date("2026-08-04T10:04:59.000Z"))
  );
});

test("website intake is signed, HTTPS-only and duplicate-safe by event id", async () => {
  let sent;
  const result = await forwardWebsiteIntake(submission, {
    CRM_WEBSITE_INTAKE_SECRET: "synthetic-website-intake-secret-that-is-long-enough",
    CRM_WEBSITE_INTAKE_URL: "https://crm.example.test/api/intake/website"
  }, async (url, options) => {
    sent = { options, url };
    return { ok: true, status: 202 };
  }, () => new Date("2026-08-04T10:00:00.000Z"), () => 1785837600);

  assert.deepEqual(result, { accepted: true });
  assert.equal(sent.url, "https://crm.example.test/api/intake/website");
  assert.match(sent.options.headers["x-rainbow-intake-signature"], /^t=1785837600,v1=[a-f0-9]{64}$/);
  assert.equal(JSON.parse(sent.options.body).eventId, submission.clientEventId);
});

test("the public enquiry form uses the same-origin CRM bridge without uploading files", async () => {
  const [form, config] = await Promise.all([
    readFile(new URL("../Book-Consultation.dc.html", import.meta.url), "utf8"),
    readFile(new URL("../site-config.js", import.meta.url), "utf8")
  ]);
  assert.match(config, /endpoint: "\/api\/crm\/intake"/);
  assert.match(form, /clientEventId/);
  assert.match(form, /privacyAccepted: true/);
  assert.match(form, /submissionId: ''/);
  assert.match(form, /submittedAt: ''/);
  assert.match(form, /this\.state\.submissionId \|\| window\.crypto\.randomUUID\(\)/);
  assert.match(form, /this\.state\.submittedAt \|\| new Date\(\)\.toISOString\(\)/);
  assert.match(form, /\['reason', 'session', 'event', 'program'\]/);
  assert.doesNotMatch(form, /window\.location\.pathname \+ window\.location\.search/);
  assert.match(form, /JSON\.stringify/);
  assert.match(form, /Private Healing intake is still protected/);
  assert.doesNotMatch(form, /payload\.append\('headshot'/);
});

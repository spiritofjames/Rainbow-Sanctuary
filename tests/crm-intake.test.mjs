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
    program: "general-enquiry",
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

test("a central-form enquiry is explicitly classified as a general main-website enquiry", () => {
  const general = normalizePublicIntake({
    ...submission,
    reason: "other",
    sourcePage: "/apply"
  }, receivedAt);
  assert.equal(general.program, "general-enquiry");
  assert.equal(general.sourcePage, "/apply");
});

test("valid international WhatsApp numbers are not misclassified as payment-card data", () => {
  const normalized = normalizePublicIntake({
    ...submission,
    whatsapp: "+62 812 3456 7890"
  }, receivedAt);
  assert.equal(normalized.phone, "+62 812 3456 7890");
});

test("valid email addresses containing long numeric identifiers remain acceptable", () => {
  const normalized = normalizePublicIntake({
    ...submission,
    email: "qa-enquiry-1786289134896@example.com"
  }, receivedAt);
  assert.equal(normalized.email, "qa-enquiry-1786289134896@example.com");
});

test("private healing stays gated unless its confidential provider and photo consent are explicit", () => {
  assert.throws(() => normalizePublicIntake({ ...submission, reason: "private-healing" }, receivedAt), /private healing/i);
  assert.throws(
    () => normalizePublicIntake({ ...submission, reason: "private-healing" }, receivedAt, { allowPrivateHealing: true }),
    /headshot consent/i
  );
  const privateIntake = normalizePublicIntake({
    ...submission,
    message: "Requested session: karma\n\nCurrent context:\nSeeking support.\n\nIntended outcome:\nGreater clarity.",
    photoConsent: true,
    program: "karma",
    reason: "private-healing"
  }, receivedAt, { allowPrivateHealing: true });
  assert.equal(privateIntake.area, "private-healing");
  assert.equal(privateIntake.pathway, "program");
  assert.equal(privateIntake.program, "karma");
});

test("Autism & Family Support registration is a separately gated, parent-contact intake", () => {
  const autism = {
    ...submission,
    message: "Autism & Family Support weekly registration\n\nParticipant name: Alex\nAge: 9\nCountry: Panama",
    photoConsent: true,
    program: "autism-family-support",
    reason: "family",
    sourcePage: "/apply?reason=family&program=autism-family-support"
  };
  assert.throws(() => normalizePublicIntake(autism, receivedAt), /autism registration/i);
  const normalized = normalizePublicIntake(autism, receivedAt, { allowAutismRegistration: true });
  assert.equal(normalized.area, "family");
  assert.equal(normalized.program, "autism-family-support");
  assert.equal(normalized.displayName, "Generated Visitor");
  assert.match(normalized.requestMessage, /Participant name: Alex/);
});

test("unsafe or unconsented submissions fail closed", () => {
  assert.throws(() => normalizePublicIntake({ ...submission, privacyAccepted: false }, receivedAt), /consent/i);
  assert.throws(() => normalizePublicIntake({ ...submission, message: "Too short" }, receivedAt), /invalid enquiry fields/i);
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

test("Preview CRM handoff uses a short-lived Vercel trusted-source token", async () => {
  let sent;
  await forwardWebsiteIntake(submission, {
    CRM_WEBSITE_INTAKE_SECRET: "synthetic-website-intake-secret-that-is-long-enough",
    CRM_WEBSITE_INTAKE_URL: "https://crm.example.test/api/intake/website",
    VERCEL_ENV: "preview"
  }, async (url, options) => {
    sent = { options, url };
    return { ok: true, status: 202 };
  }, () => new Date("2026-08-04T10:00:00.000Z"), () => 1785837600, async () => "short-lived-preview-oidc-token");

  assert.equal(sent.options.headers["x-vercel-trusted-oidc-idp-token"], "short-lived-preview-oidc-token");
});

test("the enquiry form uses JSON for ordinary requests and private multipart only for approved protected photo paths", async () => {
  const [form, config] = await Promise.all([
    readFile(new URL("../Book-Consultation.dc.html", import.meta.url), "utf8"),
    readFile(new URL("../site-config.js", import.meta.url), "utf8")
  ]);
  assert.match(config, /endpoint: "\/api\/crm\/intake"/);
  assert.match(form, /clientEventId/);
  assert.match(form, /name="message"[^>]*minlength="10"[^>]*required="true"/);
  assert.match(form, /privacyAccepted: true/);
  assert.match(form, /submissionId: ''/);
  assert.match(form, /submittedAt: ''/);
  assert.match(form, /this\.state\.submissionId \|\| window\.crypto\.randomUUID\(\)/);
  assert.match(form, /this\.state\.submittedAt \|\| new Date\(\)\.toISOString\(\)/);
  assert.match(form, /\['reason', 'session', 'event', 'program'\]/);
  assert.doesNotMatch(form, /window\.location\.pathname \+ window\.location\.search/);
  assert.match(form, /JSON\.stringify/);
  assert.doesNotMatch(form, /Private Healing intake is still protected/);
  assert.match(form, /new FormData\(\)/);
  assert.match(form, /requestBody\.append\('headshot'/);
  assert.match(form, /isAutismRegistration/);
  assert.match(form, /participantName/);
  assert.match(form, /Complete free registration/);
  assert.match(form, /maximum 2 MB/);
  assert.match(form, /automatically deleted after 30 days/);
});

test("the request-received dialog keeps phone controls reachable without scrolling the page behind it", async () => {
  const [form, styles] = await Promise.all([
    readFile(new URL("../Book-Consultation.dc.html", import.meta.url), "utf8"),
    readFile(new URL("../application.css", import.meta.url), "utf8")
  ]);

  assert.match(form, /rs-application-acknowledgement__body/);
  assert.match(form, /rs-application-acknowledgement__actions/);
  assert.match(form, /rs-application-dialog-open/);
  assert.match(form, /handleAcknowledgementKeydown/);
  assert.match(styles, /body\.rs-application-dialog-open\s*\{[^}]*overflow:hidden/);
  assert.match(styles, /max-height:calc\(100dvh - 48px\)/);
  assert.match(styles, /rs-application-acknowledgement__body\s*\{[^}]*overflow-y:auto/);
  assert.match(styles, /rs-application-acknowledgement__card\s*\{[^}]*overflow:hidden/);
});

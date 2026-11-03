import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Readable } from "node:stream";
import intakeHandler from "../api/crm/intake.mjs";
import { karmaPaymentUrl, savedKarmaPaymentUrl } from "../api/_lib/karma-booking.mjs";
import { karmaBookingDetailsReceipt, enquiryOperationsMessage } from "../api/_lib/operations-notification.mjs";

const reference = "12e9e9fd-367f-4f92-a6d2-bbe8e977d398";
const paymentUrl = karmaPaymentUrl(reference);
const source = readFileSync(new URL("../Book-Consultation.dc.html", import.meta.url), "utf8");
const logic = source.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/)[1];

function makeForm({ session = "karma", replies = [{ ok: true, json: async () => ({ accepted: true, paymentUrl }) }] } = {}) {
  const calls = [], navigations = [];
  const context = vm.createContext({
    URLSearchParams, FormData, HTMLElement: class {},
    DCLogic: class { setState(update) { Object.assign(this.state, update); } },
    document: { body: { classList: { remove() {}, add() {} } }, querySelector: () => null },
    window: {
      location: { pathname: "/apply", search: `?reason=private-healing&session=${session}`, assign: url => navigations.push(url) },
      crypto: { randomUUID: () => reference },
      RAINBOW_SANCTUARY_CONFIG: { form: { endpoint: "/api/crm/intake" } }, requestAnimationFrame() {}
    },
    fetch: async (url, options) => {
      assert.equal(navigations.length, 0, "Navigation must not happen before the application response");
      calls.push({ url, payload: JSON.parse(options.body.get("payload")), file: options.body.get("headshot") });
      return replies[Math.min(calls.length - 1, replies.length - 1)];
    }
  });
  vm.runInContext(`${logic}\nglobalThis.FormComponent = Component;`, context);
  const form = new context.FormComponent({});
  form.componentDidMount();
  form.openAcknowledgement = () => {};
  form.setState({ name: "Synthetic Booking", email: "booking@example.test", whatsapp: "+12025550147", currentChallenges: "Synthetic context only.", intendedOutcome: "Understand the next step.", photoFile: new Blob(["synthetic"], { type: "image/png" }) });
  return { form, calls, navigations };
}

test("Karma handoff is one fixed payment link with an opaque reference and no private data", () => {
  const url = new URL(paymentUrl);
  assert.equal(url.origin, "https://book.stripe.com");
  assert.equal(url.pathname, "/3cIdR9dEd1mdfU15ov3Nm0q");
  assert.deepEqual([...url.searchParams.keys()], ["client_reference_id"]);
  assert.equal(url.searchParams.get("client_reference_id"), reference);
  assert.throws(() => karmaPaymentUrl("visitor@example.test"));
  assert.equal(savedKarmaPaymentUrl({ area: "other", program: "karma" }, {}), null);
  for (const state of [{}, { enabled: true }, { enabled: true, contactId: "41001", attachmentStored: false }]) {
    assert.throws(() => savedKarmaPaymentUrl({ area: "private-healing", program: "karma", eventId: reference }, state));
  }
});

test("Karma saves the required application before navigating and retains a payment fallback link", async () => {
  const { form, calls, navigations } = makeForm();
  assert.equal(form.renderVals().submitLabel, "Continue to payment — USD 500");
  await form.renderVals().handleSubmit({ preventDefault() {} });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].payload.email, "booking@example.test");
  assert.equal(calls[0].payload.whatsapp, "+12025550147");
  assert.equal(calls[0].payload.currentChallenges, "Synthetic context only.");
  assert.ok(calls[0].file);
  assert.equal(Object.hasOwn(calls[0].payload, "schedulingTimezone"), false);
  assert.deepEqual(navigations, [paymentUrl]);
  assert.equal(form.state.paymentUrl, paymentUrl);
  assert.equal(form.state.showAcknowledgement, false);
});

test("failed saves, missing acceptance and unsafe URLs cannot redirect to payment", async () => {
  for (const reply of [
    { ok: false, status: 502 },
    { ok: true, json: async () => ({ accepted: true }) },
    { ok: true, json: async () => ({ accepted: false, paymentUrl }) },
    { ok: true, json: async () => ({ accepted: true, paymentUrl: "https://example.test/charge" }) },
    { ok: true, json: async () => ({ accepted: true, paymentUrl: `${paymentUrl}&redirect=https://example.test` }) }
  ]) {
    const { form, navigations } = makeForm({ replies: [reply] });
    await form.renderVals().handleSubmit({ preventDefault() {} });
    assert.equal(navigations.length, 0);
    assert.equal(form.state.submitted, false);
    assert.match(form.state.error, /could not confirm/);
  }
});

test("service-unavailable response preserves entered data and does not blame visitor fields or redirect", async () => {
  const { form, navigations } = makeForm({ replies: [{ ok: false, status: 503 }] });
  await form.renderVals().handleSubmit({ preventDefault() {} });
  assert.match(form.state.error, /service is temporarily unavailable/);
  assert.doesNotMatch(form.state.error, /validate|refresh|check the required/);
  assert.equal(form.state.name, "Synthetic Booking");
  assert.equal(form.state.email, "booking@example.test");
  assert.ok(form.state.photoFile);
  assert.equal(form.state.submitted, false);
  assert.equal(navigations.length, 0);
});

test("missing private staging configuration returns 503 before any HubSpot or payment activity", async t => {
  const keys = ["CRM_WEBSITE_INTAKE_ENABLED", "CRM_ALLOWED_INTAKE_ORIGINS", "HUBSPOT_PRIVATE_INTAKE_ENABLED"];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  t.after(() => { globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  globalThis.fetch = async () => { calls++; throw new Error("Real network access is forbidden"); };
  process.env.CRM_WEBSITE_INTAKE_ENABLED = "true";
  process.env.CRM_ALLOWED_INTAKE_ORIGINS = "https://booking.example.test";
  delete process.env.HUBSPOT_PRIVATE_INTAKE_ENABLED;
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await intakeHandler({ method: "POST", headers: { origin: "https://booking.example.test", host: "booking.example.test", "content-type": "application/json" }, body: { reason: "private-healing", program: "karma" } }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.headers["Retry-After"], "60");
  assert.match(response.body.error, /temporarily unavailable/);
  assert.equal(response.body.paymentUrl, undefined);
  assert.equal(calls, 0);
});

test("missing headshot stops before save/payment, and other private sessions retain their application behavior", async () => {
  const missing = makeForm(); missing.form.state.photoFile = null;
  await missing.form.renderVals().handleSubmit({ preventDefault() {} });
  assert.equal(missing.calls.length, 0); assert.equal(missing.navigations.length, 0);
  const other = makeForm({ session: "family-field", replies: [{ ok: true }] });
  assert.equal(other.form.renderVals().submitLabel, "Submit application");
  await other.form.renderVals().handleSubmit({ preventDefault() {} });
  assert.equal(other.form.state.showAcknowledgement, true); assert.equal(other.navigations.length, 0);
});

test("Karma receipt and manager alert distinguish saved details from a completed payment", () => {
  const intake = { area: "private-healing", program: "karma", eventId: reference, displayName: "Synthetic Booking", email: "booking@example.test", requestMessage: "Private context must not appear" };
  const receipt = karmaBookingDetailsReceipt(intake);
  assert.match(receipt.text, /not that payment is complete/);
  assert.ok(receipt.text.includes(paymentUrl));
  assert.doesNotMatch(receipt.text, /Private context must not appear/);
  const ops = enquiryOperationsMessage(intake, { enabled: true, contactUrl: "https://app-na2.hubspot.com/contacts/1/record/0-1/2" }, { RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life" });
  assert.match(ops.subject, /payment not yet confirmed/);
  assert.doesNotMatch(ops.text, /Private context must not appear/);
});

test("real intake handler releases payment URL only after contact, private file and note persist", async t => {
  const environment = {
    CRM_WEBSITE_INTAKE_ENABLED: "true", CRM_ALLOWED_INTAKE_ORIGINS: "https://booking.example.test",
    HUBSPOT_INTAKE_ENABLED: "true", HUBSPOT_PRIVATE_INTAKE_ENABLED: "true", HUBSPOT_PRIVATE_INTAKE_TTL: "P30D",
    HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough", HUBSPOT_OWNER_ID: "12345", HUBSPOT_PORTAL_ID: "67890",
    RESEND_EMAIL_ENABLED: "false", RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life"
  };
  const saved = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  Object.assign(process.env, environment);
  for (const failure of [null, "contact", "file", "note"]) {
    const calls = [];
    globalThis.fetch = async (target, options) => {
      const url = String(target);
      const kind = url.endsWith("contacts/batch/upsert") ? "contact" : url.endsWith("/files/v3/files") ? "file" : url.endsWith("/objects/notes") ? "note" : "unexpected";
      assert.notEqual(kind, "unexpected", "Real network access is forbidden");
      calls.push(kind);
      if (kind === failure) return new Response("{}", { status: 503 });
      if (kind === "contact") return Response.json({ results: [{ id: "41001" }] });
      if (kind === "file") return Response.json({ id: "51001" });
      assert.match(JSON.parse(options.body).properties.hs_note_body, /Payment status at application/);
      return Response.json({ id: "61001" });
    };
    const form = new FormData();
    form.append("payload", JSON.stringify({ clientEventId: reference, name: "Synthetic Booking", email: "booking@example.test", whatsapp: "+12025550147", reason: "private-healing", program: "karma", currentChallenges: "Synthetic context only.", intendedOutcome: "Understand next steps.", message: "Synthetic booking context only.", photoConsent: true, privacyAccepted: true, privacyPolicyVersion: "9 August 2026", sourcePage: "/apply?reason=private-healing&session=karma", submittedAt: new Date().toISOString() }));
    form.append("headshot", new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], { type: "image/png" }), "synthetic.png");
    const encoded = new Request("https://booking.example.test/api/crm/intake", { method: "POST", body: form });
    const request = Readable.from([Buffer.from(await encoded.arrayBuffer())]);
    request.method = "POST";
    request.headers = { origin: "https://booking.example.test", host: "booking.example.test", "content-type": encoded.headers.get("content-type") };
    const response = { setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await intakeHandler(request, response);
    if (!failure) {
      assert.equal(response.statusCode, 202);
      assert.deepEqual(response.body, { accepted: true, paymentUrl });
      assert.deepEqual(calls, ["contact", "file", "note"]);
    } else {
      assert.equal(response.statusCode, 502);
      assert.equal(response.body.paymentUrl, undefined);
      assert.equal(response.body.accepted, undefined);
    }
  }
});

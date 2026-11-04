import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizePublicIntake } from "../api/_lib/crm-intake.mjs";
import { mirrorHubSpotIntake } from "../api/_lib/hubspot-intake.mjs";
import { attemptVisitorIntakeReceipt, enquiryOperationsMessage, visitorIntakeReceipt } from "../api/_lib/operations-notification.mjs";
import intakeHandler from "../api/crm/intake.mjs";

const PROGRAM = "awakening-inner-light-december-2026";
const source = readFileSync(new URL("../Book-Consultation.dc.html", import.meta.url), "utf8");
const logic = source.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/)[1];
const id = "12e9e9fd-367f-4f92-a6d2-bbe8e977d398";

function makeForm(query, responses = [{ ok: true, status: 202 }]) {
  const calls = [];
  const context = vm.createContext({
    URLSearchParams,
    FormData,
    HTMLElement: class {},
    DCLogic: class { setState(update) { Object.assign(this.state, update); } },
    document: { body: { classList: { remove() {}, add() {} } }, querySelector: () => null },
    window: {
      location: { pathname: "/apply", search: query },
      crypto: { randomUUID: () => id },
      RAINBOW_SANCTUARY_CONFIG: { form: { endpoint: "/api/crm/intake", method: "POST" } },
      requestAnimationFrame: () => {}
    },
    fetch: async (url, options) => {
      calls.push({ url, options, payload: JSON.parse(options.body) });
      return responses[Math.min(calls.length - 1, responses.length - 1)];
    }
  });
  vm.runInContext(`${logic}\nglobalThis.FormComponent = Component;`, context);
  const form = new context.FormComponent({});
  form.componentDidMount();
  form.openAcknowledgement = () => {};
  form.setState({ name: "Synthetic Retreat Visitor", email: "retreat-visitor@example.test", whatsapp: "+507 6000 0000" });
  return { form, calls };
}

async function submit(form) {
  await form.renderVals().handleSubmit({ preventDefault() {} });
}

test("December discovery-call link preselects the request and describes a human-arranged time", () => {
  const { form } = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`);
  assert.equal(form.state.retreatIntent, "discovery-call");
  assert.equal(form.renderVals().isDecemberRetreat, true);
  assert.equal(form.renderVals().submitLabel, "Request a discovery call");
  assert.match(form.state.message, /private discovery call/);
  assert.match(form.renderVals().acknowledgementSummary, /arrange a suitable time/);
  assert.match(form.renderVals().acknowledgementSummary, /No time slot has been booked/);
  assert.doesNotMatch(form.renderVals().acknowledgementSummary, /immediate acknowledgement/);
  assert.match(form.renderVals().closedAcknowledgementSummary, /normally sent shortly/);
});

test("the visitor can choose discovery or ordinary interest without changing the December programme", async () => {
  const { form, calls } = makeForm(`?reason=events&program=${PROGRAM}&tracking=discard-me`);
  assert.equal(form.state.retreatIntent, "register-interest");
  form.renderVals().onRetreatIntentChange({ target: { value: "discovery-call" } });
  await submit(form);
  assert.equal(calls[0].payload.program, PROGRAM);
  assert.equal(calls[0].payload.sourcePage, `/apply?reason=events&program=${PROGRAM}&intent=discovery-call`);
  assert.match(calls[0].payload.message, /^Discovery call requested for the December retreat\./);
  assert.doesNotMatch(calls[0].payload.sourcePage, /tracking/);
  assert.equal(calls[0].payload.clientEventId, id);
  assert.equal(form.state.submitted, true);

  const standard = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`);
  standard.form.renderVals().onRetreatIntentChange({ target: { value: "register-interest" } });
  await submit(standard.form);
  assert.equal(standard.calls[0].payload.sourcePage, `/apply?reason=events&program=${PROGRAM}`);
  assert.doesNotMatch(standard.calls[0].payload.message, /^Discovery call requested/);
  assert.match(standard.calls[0].payload.message, /register interest/);
});

test("changing pathway clears the previous programme and call intent instead of reviving them from the URL", async () => {
  const { form, calls } = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`);
  form.renderVals().onReasonChange({ target: { value: "other" } });
  form.renderVals().onMessageChange({ target: { value: "I would like help with a different question." } });
  await submit(form);
  assert.equal(form.state.program, "");
  assert.equal(form.state.retreatIntent, "register-interest");
  assert.equal(calls[0].payload.program, undefined);
  assert.equal(calls[0].payload.sourcePage, "/apply?reason=other");
  const intake = normalizePublicIntake(calls[0].payload);
  assert.equal(intake.program, "general-enquiry");
  assert.equal(intake.area, "other");
});

test("unrelated programmes cannot acquire the December discovery-call intent", async () => {
  const { form, calls } = makeForm("?reason=spiral&program=spiral-i&intent=discovery-call");
  assert.equal(form.state.retreatIntent, "register-interest");
  assert.equal(form.renderVals().isDecemberRetreat, false);
  await submit(form);
  assert.equal(calls[0].payload.sourcePage, "/apply?reason=spiral&program=spiral-i");
  assert.doesNotMatch(visitorIntakeReceipt(normalizePublicIntake(calls[0].payload)).variables.ENQUIRY_TOPIC, /Discovery/);
});

test("December call intent reaches HubSpot and both email topics without changing the CRM v2 schema", async () => {
  const { form, calls } = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`);
  await submit(form);
  const intake = normalizePublicIntake(calls[0].payload);
  assert.equal(intake.schemaVersion, "rainbow.website-intake.v2");
  assert.equal(Object.hasOwn(intake, "intent"), false);
  assert.equal(intake.program, PROGRAM);
  const requests = [];
  const hubspot = await mirrorHubSpotIntake(intake, {
    HUBSPOT_INTAKE_ENABLED: "true",
    HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough",
    HUBSPOT_OWNER_ID: "12345",
    HUBSPOT_PORTAL_ID: "67890"
  }, async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ results: [{ id: "41003" }] }) };
  });
  assert.equal(requests[0].body.inputs[0].properties.hubspot_owner_id, "12345");
  assert.match(requests[1].body.properties.hs_note_body, /Discovery call requested for the December retreat/);
  assert.match(requests[1].body.properties.hs_note_body, /intent=discovery-call/);
  const notification = enquiryOperationsMessage(intake, hubspot, { RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life" });
  assert.match(notification.subject, /3–9 December 2026 · Discovery call requested/);
  assert.doesNotMatch(notification.text, /I would like a private discovery call/);
  const receipt = visitorIntakeReceipt(intake);
  assert.equal(receipt.alias, "rs-enquiry-received");
  assert.match(receipt.variables.ENQUIRY_TOPIC, /3–9 December 2026 · Discovery call requested/);

  const sends = [];
  await attemptVisitorIntakeReceipt(intake, {
    RESEND_EMAIL_ENABLED: "true", RESEND_API_KEY: "re_synthetic",
    VERCEL_ENV: "preview", RESEND_ALLOWED_RECIPIENTS: intake.email
  }, { emails: { send: async (message, options) => { sends.push({ message, options }); return { data: { id: "receipt_test" } }; } } });
  assert.match(sends[0].message.text, /Discovery call requested/);
  assert.match(sends[0].message.text, /does not create a booking/);
  assert.equal(sends[0].options.idempotencyKey, `intake:${id}:visitor-received`);
});

test("an uncertain response preserves the submission reference and does not falsely promise data was unsaved", async () => {
  const { form, calls } = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`, [{ ok: false, status: 502 }, { ok: true, status: 202 }]);
  await submit(form);
  assert.match(form.state.error, /may already have reached our team/);
  assert.doesNotMatch(form.state.error, /not saved/);
  await submit(form);
  assert.equal(calls[0].payload.clientEventId, calls[1].payload.clientEventId);
  assert.equal(calls[0].payload.submittedAt, calls[1].payload.submittedAt);
  assert.equal(form.state.submitted, true);
});

test("the HTTP intake handler carries the December request through all five mocked provider calls", async (t) => {
  const { form, calls } = makeForm(`?reason=events&program=${PROGRAM}&intent=discovery-call`);
  await submit(form);
  const environment = {
    CRM_WEBSITE_INTAKE_ENABLED: "true",
    CRM_WEBSITE_INTAKE_URL: "https://crm.example.test/api/intake/website",
    CRM_WEBSITE_INTAKE_SECRET: "synthetic-intake-secret-at-least-32-characters",
    CRM_ALLOWED_INTAKE_ORIGINS: "https://retreat.example.test",
    HUBSPOT_INTAKE_ENABLED: "true",
    HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough",
    HUBSPOT_OWNER_ID: "12345",
    HUBSPOT_PORTAL_ID: "67890",
    RESEND_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "re_synthetic",
    RESEND_ALLOWED_RECIPIENTS: "retreat-visitor@example.test,ethel@rainbowsanctuary.life",
    RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life",
    VERCEL_ENV: "development"
  };
  const originalEnvironment = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  Object.assign(process.env, environment);
  const providers = [];
  globalThis.fetch = async (target, options) => {
    const url = String(target);
    const body = JSON.parse(options.body);
    providers.push({ url, body, headers: options.headers });
    if (url === environment.CRM_WEBSITE_INTAKE_URL) return new Response("{}", { status: 202 });
    if (url === "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert") return Response.json({ results: [{ id: "41003" }] });
    if (url === "https://api.hubapi.com/crm/v3/objects/notes") return Response.json({ id: "51003" });
    if (url === "https://api.resend.com/emails") return Response.json({ id: `test-email-${providers.length}` });
    throw new Error("Unexpected provider target; real network access is forbidden in this test.");
  };
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; }
  };
  await intakeHandler({ method: "POST", headers: { origin: "https://retreat.example.test", host: "retreat.example.test", "content-type": "application/json" }, body: calls[0].payload }, response);
  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.body, { accepted: true });
  assert.equal(providers.length, 5);
  assert.equal(providers[0].body.program, PROGRAM);
  assert.match(providers[0].headers["x-rainbow-intake-signature"], /^t=\d+,v1=[a-f0-9]{64}$/);
  assert.match(providers[2].body.properties.hs_note_body, /Discovery call requested/);
  const emails = providers.filter(({ url }) => url === "https://api.resend.com/emails");
  assert.equal(emails.length, 2);
  assert.deepEqual(emails[0].body.to, ["retreat-visitor@example.test"]);
  assert.deepEqual(emails[1].body.to, ["ethel@rainbowsanctuary.life"]);
  assert.match(emails[0].body.text, /Discovery call requested/);
  assert.match(emails[1].body.subject, /Discovery call requested/);
});

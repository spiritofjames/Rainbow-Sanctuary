import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import test from "node:test";
import { hydrateStaffPaymentLinkEvent } from "../api/_lib/staff-payment-links.mjs";
import { mirrorHubSpotPurchase, toHubSpotPurchaseProperties } from "../api/_lib/hubspot-payment.mjs";
import { resolveOfferVariant } from "../api/_lib/offer-catalog.mjs";
import { purchaseOperationsMessage } from "../api/_lib/operations-notification.mjs";

const linkId = "plink_1UIJ2kHrqlaOfUb7aRYSFyju";
const environment = {
  HUBSPOT_INTAKE_ENABLED: "true",
  HUBSPOT_ACCESS_TOKEN: "pat-synthetic-test-only-not-a-credential",
  HUBSPOT_OWNER_ID: "123",
  HUBSPOT_PORTAL_ID: "456"
};
const checkout = (values = {}) => ({
  id: "evt_synthetic_private_healing",
  type: "checkout.session.completed",
  created: 1795747200,
  livemode: false,
  data: { object: {
    id: "cs_test_private_healing",
    payment_intent: "pi_test_private_healing",
    payment_link: linkId,
    mode: "payment",
    payment_status: "paid",
    amount_subtotal: 50000,
    amount_total: 50000,
    currency: "usd",
    customer_details: { name: "Synthetic Participant", email: "participant@example.com" },
    metadata: {},
    ...values
  } }
});
const forWebhook = (event) => hydrateStaffPaymentLinkEvent(event, environment, { privateHealingWebhook: true });

test("a paid $500 Private Healing link checkout without metadata reaches the correct owned CRM contact", async () => {
  const result = await mirrorHubSpotPurchase(forWebhook(checkout()), environment, async (url, options) => {
    assert.equal(new URL(url).hostname, "api.hubapi.com");
    const input = JSON.parse(options.body).inputs[0];
    assert.equal(input.idProperty, "email");
    assert.equal(input.id, "participant@example.com");
    assert.equal(input.properties.hubspot_owner_id, "123");
    assert.equal(input.properties.program_or_offering, "Private Healing");
    assert.equal(input.properties.area_of_interest, "Private healing");
    assert.match(input.properties.enquiry_details, /Paid USD 500\.00/);
    assert.match(input.properties.enquiry_details, /Appointment not yet scheduled/);
    return { ok: true, status: 200, json: async () => ({ results: [{ id: "42001" }] }) };
  });
  assert.equal(result.enabled, true);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.contactId, "42001");
});

test("only the exact link and paid one-time USD 500 qualify; private healing never becomes a public checkout offer", () => {
  for (const [reason, input] of Object.entries({
    wrongLink: { payment_link: "plink_otherPrivateHealing" },
    unrelatedLinkWithCopiedMetadata: { payment_link: "plink_otherPrivateHealing", metadata: { offer_key: "staff-private-healing-payment", event_id: "private-healing-staff-follow-up" } },
    partialPayment: { amount_total: 20000 },
    wrongSubtotal: { amount_subtotal: 60000 },
    unpaid: { payment_status: "unpaid" },
    subscription: { mode: "subscription" },
    wrongCurrency: { currency: "eur" },
    conflictingOffer: { metadata: { offer_key: "personal-karma-reconciliation", event_id: "personal-karma-reconciliation-private-session" } }
  })) {
    assert.throws(() => toHubSpotPurchaseProperties(forWebhook(checkout(input)), "123"), undefined, reason);
  }
  assert.deepEqual(hydrateStaffPaymentLinkEvent(checkout(), environment).data.object.metadata, {});
  assert.throws(() => resolveOfferVariant("staff-private-healing-payment"), /not available/);
});

test("Private Healing operations use manual scheduling and a stable key across deliveries", () => {
  const hubspot = { enabled: true, contactUrl: "https://app-na2.hubspot.com/contacts/456/record/0-1/42001" };
  const opsEnvironment = { ...environment, RAINBOW_OPERATIONS_EMAIL: "operations@rainbowsanctuary.life" };
  const event = checkout();
  const first = purchaseOperationsMessage(forWebhook(event), hubspot, opsEnvironment);
  const second = purchaseOperationsMessage(forWebhook({ ...event, id: "evt_synthetic_later_delivery" }), hubspot, opsEnvironment);
  assert.equal(first.subject, "Payment received — Private Healing");
  assert.match(first.text, /Payment alone does not confirm an appointment/);
  assert.equal(first.idempotencyKey, "stripe-checkout:cs_test_private_healing:operations");
  assert.equal(second.idempotencyKey, first.idempotencyKey);
});

test("Private Healing does not acknowledge a CRM write that lost payment details", async () => {
  let calls = 0;
  await assert.rejects(mirrorHubSpotPurchase(forWebhook(checkout()), environment, async () => {
    calls++;
    return { ok: true, status: 200, json: async () => ({ results: [] }) };
  }), /not recorded on a HubSpot contact/);
  assert.equal(calls, 1, "do not fall back to a contact write without payment details");
});

test("signed Private Healing delivery acknowledges only after the real CRM handoff and never starts booking automation", async (t) => {
  const { default: handler } = await import("../api/stripe/webhook.mjs");
  const before = process.env;
  const signingSecret = "whsec_synthetic_regression_test_only";
  process.env = {
    ...environment,
    STRIPE_SECRET_KEY: "sk_test_synthetic_regression_test_only",
    STRIPE_WEBHOOK_SECRET: signingSecret,
    STRIPE_OPTIONAL_CONTRIBUTION_PAYMENT_LINK_ID: linkId,
    CRM_STRIPE_EVENT_URL: "https://crm.example.test/stripe",
    CRM_STRIPE_EVENT_SECRET: "synthetic-secondary-mirror-secret-not-a-credential",
    RAINBOW_OPERATIONS_EMAIL: "operations@rainbowsanctuary.life",
    RESEND_EMAIL_ENABLED: "false"
  };
  t.after(() => { process.env = before; });
  t.mock.method(console, "info", () => {});
  t.mock.method(console, "error", () => {});

  const seen = [];
  let hubspotAvailable = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    seen.push(new URL(url).hostname);
    assert.equal(new URL(url).hostname, "api.hubapi.com");
    assert.equal(JSON.parse(options.body).inputs[0].properties.program_or_offering, "Private Healing");
    return { ok: hubspotAvailable, status: hubspotAvailable ? 200 : 503, json: async () => ({ results: [{ id: "42001" }] }) };
  });
  const request = async (signatureValid = true) => {
    const body = JSON.stringify(checkout());
    const time = Math.floor(Date.now() / 1000);
    const hmac = createHmac("sha256", signingSecret).update(`${time}.${body}`).digest("hex");
    const req = Readable.from([body]);
    req.method = "POST";
    req.headers = { "stripe-signature": `t=${time},v1=${signatureValid ? hmac : "bad"}` };
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; } };
    await handler(req, res);
    return res.code;
  };
  assert.equal(await request(false), 400);
  assert.deepEqual(seen, []);
  assert.equal(await request(), 200);
  assert.deepEqual(seen, ["api.hubapi.com"]);
  assert.equal(console.info.mock.calls[0].arguments[1].bookingEmailReason, "manual-private-healing-follow-up");
  hubspotAvailable = false;
  assert.equal(await request(), 500);
  process.env.HUBSPOT_INTAKE_ENABLED = "false";
  assert.equal(await request(), 500);
  assert.deepEqual(seen, ["api.hubapi.com", "api.hubapi.com"]);
});

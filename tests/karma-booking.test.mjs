import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveOfferVariant } from "../api/_lib/offer-catalog.mjs";
import { hydrateStaffPaymentLinkEvent } from "../api/_lib/staff-payment-links.mjs";
import { crmPaymentHandoff } from "../api/_lib/webhook-delivery.mjs";
import { mirrorHubSpotPurchase, toHubSpotPurchaseProperties } from "../api/_lib/hubspot-payment.mjs";
import { purchaseConfirmationFromStripeEvent, sendPurchaseConfirmation } from "../api/_lib/group-healing-booking-email.mjs";
import { purchaseOperationsMessage, visitorIntakeReceipt } from "../api/_lib/operations-notification.mjs";
import { normalizePublicIntake } from "../api/_lib/crm-intake.mjs";
import { checkoutSessionParameters } from "../api/_lib/checkout-policy.mjs";
import { Readable } from "node:stream";
import Stripe from "stripe";
import stripeWebhook from "../api/stripe/webhook.mjs";

const environment = {
  HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-not-a-real-credential",
  HUBSPOT_INTAKE_ENABLED: "true", HUBSPOT_OWNER_ID: "123", HUBSPOT_PORTAL_ID: "456",
  STRIPE_STAFF_PAYMENT_LINK_MAP: "plink_SyntheticKarma:personal-karma-reconciliation",
  RAINBOW_OPERATIONS_EMAIL: "qa-operations@rainbowsanctuary.life",
  RESEND_EMAIL_ENABLED: "true", RESEND_API_KEY: "synthetic-not-a-real-key",
  RESEND_ALLOWED_RECIPIENTS: "karma-qa@example.test"
};
const rawPayment = {
  id: "evt_karma_synthetic", created: 1793642400, livemode: false, type: "checkout.session.completed",
  data: { object: {
    id: "cs_test_karma_synthetic", payment_intent: "pi_karma_synthetic", payment_link: "plink_SyntheticKarma",
    payment_status: "paid", amount_subtotal: 50000, amount_total: 50000, currency: "usd",
    customer_details: { name: "Synthetic Karma Customer", email: "karma-qa@example.test", phone: "+12025550101" },
    custom_fields: [{ key: "whatsappnumber1234567890", text: { value: "+1 202 555 0102" } }], metadata: {}
  } }
};
const event = hydrateStaffPaymentLinkEvent(rawPayment, environment);

test("Karma is exactly USD 500 and only an explicitly mapped Payment Link is recognized", () => {
  const offer = resolveOfferVariant("personal-karma-reconciliation");
  assert.equal(offer.amountMinor, 50000);
  assert.equal(offer.policy, "private-session");
  assert.equal(event.data.object.metadata.offer_key, offer.id);
  assert.equal(hydrateStaffPaymentLinkEvent(rawPayment, {}).data.object.metadata.offer_key, undefined);
  assert.throws(() => crmPaymentHandoff(rawPayment), /incomplete/);
});

test("a separately approved staff Checkout path also requires WhatsApp and uses the fixed price", () => {
  const offer = resolveOfferVariant("personal-karma-reconciliation");
  const parameters = checkoutSessionParameters({ offer, eventId: offer.sessionId, origin: "https://staging.rainbowsanctuary.life" });
  assert.equal(parameters.line_items[0].price_data.unit_amount, 50000);
  assert.equal(parameters.custom_fields.find(field => field.key === "whatsapp_number").optional, false);
  assert.match(parameters.custom_text.submit.message, /does not book a time automatically/);
});

test("Karma maps verified contact details and the scheduling action without erasing existing details when absent", () => {
  const customer = crmPaymentHandoff(event).customer;
  assert.equal(customer.whatsapp, "+12025550102");
  const properties = toHubSpotPurchaseProperties(event, "123");
  assert.equal(properties.phone, "+12025550102");
  assert.equal(properties.hs_whatsapp_phone_number, "+12025550102");
  assert.match(properties.enquiry_details, /Appointment not yet scheduled/);
  const missing = structuredClone(event);
  missing.data.object.custom_fields = [];
  delete missing.data.object.customer_details.phone;
  const noPhone = toHubSpotPurchaseProperties(missing, "123");
  assert.equal(Object.hasOwn(noPhone, "phone"), false);
  assert.equal(Object.hasOwn(noPhone, "hs_whatsapp_phone_number"), false);
  assert.match(purchaseOperationsMessage(missing, { enabled: true, contactUrl: "https://app-na2.hubspot.com/contacts/456/record/0-1/123" }, environment).text, /WhatsApp was not captured/);
});

test("Karma contact phone survives custom-property failure and HubSpot failures remain retryable", async () => {
  const calls = [];
  const result = await mirrorHubSpotPurchase(event, environment, async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return calls.length === 1
      ? { ok: false, status: 400 }
      : { ok: true, json: async () => ({ results: [{ id: "789" }] }) };
  });
  assert.equal(result.fallbackUsed, true);
  assert.equal(calls[1].inputs[0].properties.hs_whatsapp_phone_number, "+12025550102");
  await assert.rejects(() => mirrorHubSpotPurchase(event, environment, async () => ({ ok: false, status: 503 })), /503/);
});

test("Karma payment email is source-controlled, repeat-safe and does not claim an appointment", async () => {
  const message = purchaseConfirmationFromStripeEvent(event);
  assert.equal(message.alias, "rs-private-session-payment-received");
  assert.deepEqual(purchaseConfirmationFromStripeEvent({ ...event, id: "evt_retry_synthetic" }), message);
  let captured;
  await sendPurchaseConfirmation(event, environment, { emails: { send: async (body, options) => {
    captured = { body, options };
    return { data: { id: "email_synthetic" }, error: null };
  } } });
  assert.match(captured.body.text, /No date or time has been booked automatically/);
  assert.doesNotMatch(captured.body.text, /\{\{\{/);
  assert.match(captured.options.idempotencyKey, /cs_test_karma_synthetic/);
});

test("unpaid, wrong-price, wrong-session and unapproved live events cannot confirm Karma", () => {
  for (const change of [{ payment_status: "unpaid" }, { amount_total: 50100, amount_subtotal: 50100 }, { metadata: { offer_key: "personal-karma-reconciliation", event_id: "wrong-session" } }]) {
    assert.throws(() => purchaseConfirmationFromStripeEvent({ ...event, data: { object: { ...event.data.object, ...change } } }));
  }
  assert.throws(() => purchaseConfirmationFromStripeEvent({ ...event, livemode: true }), /approved/);
});

test("Karma intake requires consent, WhatsApp and a real timezone before payment", () => {
  const input = {
    clientEventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398", name: "Synthetic Karma Customer", email: "karma-qa@example.test",
    whatsapp: "+1 202 555 0102", reason: "private-healing", program: "karma", photoConsent: true,
    privacyAccepted: true, privacyPolicyVersion: "9 August 2026", sourcePage: "/apply?reason=private-healing&session=karma",
    message: "I would like to explore recurring patterns.", submittedAt: "2026-11-02T10:00:00Z",
    schedulingTimezone: "America/Panama", schedulingPreferences: "Weekday afternoons"
  };
  const normalize = (value) => normalizePublicIntake(value, new Date("2026-11-02T10:01:00Z"), { allowPrivateHealing: true });
  const intake = normalize(input);
  assert.equal(intake.schedulingTimezone, "America/Panama");
  assert.equal(intake.schedulingPreferences, "Weekday afternoons");
  assert.equal(visitorIntakeReceipt(intake).alias, "rs-application-received");
  for (const change of [{ schedulingTimezone: "" }, { schedulingTimezone: "not-a-timezone" }, { whatsapp: "" }, { privacyAccepted: false }]) {
    assert.throws(() => normalize({ ...input, ...change }));
  }
});

test("Karma page retains intake first, the exact owner-supplied link and honest scheduling copy", async () => {
  const page = await readFile(new URL("../Personal-Karma-Reconciliation.dc.html", import.meta.url), "utf8");
  assert.match(page, /https:\/\/book\.stripe\.com\/3cIdR9dEd1mdfU15ov3Nm0q/);
  assert.match(page, /Complete your application first/);
  assert.match(page, /Payment does not book a time automatically/);
});

test("the real webhook verifies a signature and routes Karma to HubSpot plus both emails without external traffic", async () => {
  const isolated = {
    ...environment,
    STRIPE_SECRET_KEY: "sk_test_synthetic_no_real_credential",
    STRIPE_WEBHOOK_SECRET: "whsec_synthetic_for_local_test_only_not_real",
    RESEND_ALLOWED_RECIPIENTS: `${environment.RESEND_ALLOWED_RECIPIENTS},${environment.RAINBOW_OPERATIONS_EMAIL}`,
    VERCEL_ENV: "preview",
    CRM_STRIPE_EVENT_URL: "",
    CRM_STRIPE_EVENT_SECRET: ""
  };
  const saved = Object.fromEntries(Object.keys(isolated).map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const calls = [];
  const invoke = async (signatureOverride) => {
    const payload = JSON.stringify(rawPayment);
    const request = Readable.from([Buffer.from(payload)]);
    request.method = "POST";
    request.headers = { "stripe-signature": signatureOverride || Stripe.webhooks.generateTestHeaderString({ payload, secret: isolated.STRIPE_WEBHOOK_SECRET }) };
    const response = {
      setHeader() {},
      status(value) { this.statusCode = value; return this; },
      json(value) { this.body = value; return this; }
    };
    await stripeWebhook(request, response);
    return response;
  };
  try {
    Object.assign(process.env, isolated);
    globalThis.fetch = async (url, options) => {
      const destination = String(url);
      const body = JSON.parse(options.body);
      calls.push({ destination, body, headers: options.headers });
      if (destination === "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert") {
        return new Response(JSON.stringify({ results: [{ id: "789" }] }), { status: 200 });
      }
      if (destination === "https://api.resend.com/emails") {
        return new Response(JSON.stringify({ id: `synthetic-email-${calls.length}` }), { status: 200 });
      }
      throw new Error("Unexpected external destination blocked by local test.");
    };
    assert.equal((await invoke()).statusCode, 200);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].body.inputs[0].properties.hs_whatsapp_phone_number, "+12025550102");
    assert.match(calls[1].body.text, /Appointment action required/);
    assert.match(calls[2].body.text, /No date or time has been booked automatically/);
    assert.equal((await invoke("t=1,v1=bad")).statusCode, 400);
    assert.equal(calls.length, 3, "An invalid signature must not reach either provider");
    process.env.HUBSPOT_INTAKE_ENABLED = "false";
    assert.equal((await invoke()).statusCode, 500, "Disabled HubSpot must remain a retryable Karma handoff failure");
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  enquiryOperationsMessage,
  purchaseOperationsMessage,
  sendEnquiryOperationsNotification
} from "../api/_lib/operations-notification.mjs";

const environment = {
  RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life",
  RESEND_EMAIL_ENABLED: "true",
  RESEND_API_KEY: "re_test",
  RESEND_ALLOWED_RECIPIENTS: "ethel@rainbowsanctuary.life",
  VERCEL_ENV: "preview"
};
const hubspot = {
  contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/41001",
  enabled: true
};
const intake = {
  area: "spiral",
  displayName: "Synthetic Visitor",
  email: "visitor@example.test",
  eventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
  program: "spiral-i",
  requestMessage: "Sensitive context that must not enter notification email."
};
const payment = {
  id: "evt_test_payment_123",
  type: "checkout.session.completed",
  created: 1787208000,
  livemode: false,
  data: { object: {
    id: "cs_test_payment_123",
    payment_intent: "pi_test_payment_123",
    payment_status: "paid",
    amount_total: 2200,
    currency: "usd",
    customer_details: { email: "participant@example.com", name: "Participant Person" },
    custom_fields: [{ key: "client_display_name", text: { value: "Participant Person" } }],
    metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-22" }
  } }
};

test("enquiry notification is minimal, linked to HubSpot and duplicate-safe", () => {
  const message = enquiryOperationsMessage(intake, hubspot, environment);
  assert.equal(message.to, "ethel@rainbowsanctuary.life");
  assert.equal(message.idempotencyKey, `intake:${intake.eventId}:operations`);
  assert.match(message.html, /Open contact in HubSpot/);
  assert.doesNotMatch(message.html, /Sensitive context/);
  assert.doesNotMatch(message.text, /visitor@example\.test/);
});

test("purchase notification uses the verified Stripe event and excludes payment method data", () => {
  const message = purchaseOperationsMessage(payment, hubspot, environment);
  assert.equal(message.idempotencyKey, "stripe:evt_test_payment_123:operations");
  assert.match(message.text, /USD 22\.00/);
  assert.match(message.text, /cs_test_payment_123/);
  assert.doesNotMatch(message.text, /participant@example\.com|card|4242/i);
});

test("operations notification fails closed when delivery is disabled or HubSpot link is absent", async () => {
  assert.throws(() => enquiryOperationsMessage(intake, { enabled: false }, environment), /HubSpot contact link/i);
  await assert.rejects(
    () => sendEnquiryOperationsNotification(intake, hubspot, {
      ...environment,
      RESEND_EMAIL_ENABLED: "false"
    }),
    /not enabled/i
  );
});

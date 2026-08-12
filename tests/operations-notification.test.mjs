import test from "node:test";
import assert from "node:assert/strict";
import {
  attemptEnquiryOperationsNotification,
  attemptPurchaseOperationsNotification,
  autismRegistrationReceipt,
  attemptOptionalContributionFollowUp,
  enquiryOperationsMessage,
  optionalContributionFollowUp,
  purchaseOperationsMessage,
  sendEnquiryOperationsNotification
} from "../api/_lib/operations-notification.mjs";

const environment = {
  RAINBOW_OPERATIONS_EMAIL: "ethel@rainbowsanctuary.life",
  RESEND_EMAIL_ENABLED: "true",
  RESEND_API_KEY: "re_test",
  RESEND_ALLOWED_RECIPIENTS: "ethel@rainbowsanctuary.life,visitor@example.test",
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

test("Autism registration receipt confirms the weekly list without promising review, Zoom, or clinical support", () => {
  const message = autismRegistrationReceipt({ ...intake, area: "family", program: "autism-family-support" });
  assert.equal(message.to, "visitor@example.test");
  assert.equal(message.idempotencyKey, `intake:${intake.eventId}:autism-registration`);
  assert.match(message.text, /weekly list/i);
  assert.match(message.text, /11:00 PM Beijing time/);
  assert.doesNotMatch(message.text, /review|diagnos/i);
  assert.match(message.text, /no Zoom session/i);
});

test("only free donation-based registration schedules one delayed contribution follow-up", async () => {
  const registration = {
    ...intake,
    area: "family",
    followUpAt: "2031-08-05T10:00:00.000Z",
    privacyAcceptedAt: "2031-08-04T10:00:00.000Z",
    program: "autism-family-support"
  };
  const message = optionalContributionFollowUp(registration);
  assert.equal(message.to, "visitor@example.test");
  assert.equal(message.scheduledAt, registration.followUpAt);
  assert.equal(message.idempotencyKey, `intake:${intake.eventId}:optional-contribution-follow-up`);
  assert.match(message.text, /amount is entirely your choice/i);
  assert.match(message.text, /will not send another contribution invitation/i);
  assert.match(message.text, /rainbowsanctuary\.life\/contribute/);
  assert.throws(
    () => optionalContributionFollowUp({ ...registration, program: "spiral-i" }),
    /not eligible/i
  );

  let scheduled;
  const result = await attemptOptionalContributionFollowUp(registration, environment, {
    emails: { send: async (...args) => { scheduled = args; return { data: { id: "scheduled_123" }, error: null }; } }
  });
  assert.deepEqual(result, { sent: true, id: "scheduled_123" });
  assert.equal(scheduled[0].scheduledAt, registration.followUpAt);
  assert.equal(scheduled[1].idempotencyKey, message.idempotencyKey);
  assert.deepEqual(
    await attemptOptionalContributionFollowUp({ ...registration, program: "spiral-i" }, environment),
    { reason: "not-a-free-donation-programme", sent: false }
  );
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

test("an optional operations notification cannot turn an accepted enquiry into a customer-facing failure", async () => {
  const logged = [];
  const result = await attemptEnquiryOperationsNotification(
    intake,
    hubspot,
    { ...environment, RESEND_EMAIL_ENABLED: "false" },
    undefined,
    { error: (event, detail) => logged.push({ detail, event }) }
  );

  assert.deepEqual(result, {
    reason: "operations-notification-unavailable",
    sent: false
  });
  assert.deepEqual(logged, [{
    detail: { reason: "operations-notification-unavailable" },
    event: "crm_intake_notification_error"
  }]);
});

test("an optional operations notification cannot make Stripe retry an accepted payment", async () => {
  const logged = [];
  const result = await attemptPurchaseOperationsNotification(
    payment,
    hubspot,
    { ...environment, RESEND_EMAIL_ENABLED: "false" },
    undefined,
    { error: (event, detail) => logged.push({ detail, event }) }
  );

  assert.deepEqual(result, {
    reason: "operations-notification-unavailable",
    sent: false
  });
  assert.deepEqual(logged, [{
    detail: {
      eventId: payment.id,
      reason: "operations-notification-unavailable"
    },
    event: "stripe_operations_notification_error"
  }]);
});

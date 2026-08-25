import test from "node:test";
import assert from "node:assert/strict";
import {
  attemptEnquiryOperationsNotification,
  attemptAutismRegistrationOneHourReminder,
  attemptPurchaseOperationsNotification,
  attemptOptionalContributionFollowUp,
  attemptVisitorIntakeReceipt,
  autismRegistrationReceipt,
  autismRegistrationOneHourReminder,
  enquiryOperationsMessage,
  optionalContributionFollowUp,
  purchaseOperationsMessage,
  sendEnquiryOperationsNotification,
  visitorIntakeReceipt
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
    metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-18" }
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

test("every accepted standard enquiry receives one privacy-safe acknowledgement", async () => {
  const receipt = visitorIntakeReceipt(intake);
  assert.equal(receipt.alias, "rs-enquiry-received");
  assert.equal(receipt.idempotencyKey, `intake:${intake.eventId}:visitor-received`);
  assert.deepEqual(receipt.variables, {
    ENQUIRY_TOPIC: "Spiral I",
    NAME: "Synthetic Visitor",
    REFERENCE_ID: intake.eventId
  });

  let sent;
  const result = await attemptVisitorIntakeReceipt(intake, environment, {
    emails: { send: async (...args) => { sent = args; return { data: { id: "receipt_123" }, error: null }; } }
  });
  assert.deepEqual(result, { sent: true, id: "receipt_123" });
  assert.equal(sent[0].to[0], intake.email);
  assert.equal(sent[1].idempotencyKey, receipt.idempotencyKey);
  assert.doesNotMatch(JSON.stringify(sent), /Sensitive context/);
});

test("private healing uses the application acknowledgement without exposing case details", () => {
  const receipt = visitorIntakeReceipt({ ...intake, area: "private-healing", program: "personal-karma-reconciliation" });
  assert.equal(receipt.alias, "rs-application-received");
  assert.deepEqual(receipt.variables, {
    NAME: "Synthetic Visitor",
    PATHWAY: "Personal Karma Reconciliation",
    REFERENCE_ID: intake.eventId
  });
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

test("Autism registration queues one privacy-safe reminder for the next Tuesday session", async () => {
  const registration = { ...intake, area: "family", program: "autism-family-support" };
  const now = new Date("2031-08-04T08:00:00.000Z");
  const message = autismRegistrationOneHourReminder(registration, now);
  assert.equal(message.to, registration.email);
  assert.match(message.subject, /begins in one hour/i);
  assert.match(message.text, /11:00 PM Beijing time/i);
  assert.match(message.text, /no Zoom session/i);
  assert.ok(Date.parse(message.scheduledAt) > now.getTime());

  let scheduled;
  const result = await attemptAutismRegistrationOneHourReminder(registration, environment, {
    emails: { send: async (...args) => { scheduled = args; return { data: { id: "reminder_123" }, error: null }; } }
  }, console, now);
  assert.deepEqual(result, { sent: true, id: "reminder_123" });
  assert.equal(scheduled[0].scheduledAt, message.scheduledAt);
  assert.equal(scheduled[1].idempotencyKey, message.idempotencyKey);
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

test("an unavailable visitor acknowledgement never makes an accepted enquiry fail", async () => {
  const logged = [];
  const result = await attemptVisitorIntakeReceipt(
    intake,
    { ...environment, RESEND_EMAIL_ENABLED: "false" },
    undefined,
    { error: (event, detail) => logged.push({ detail, event }) }
  );
  assert.deepEqual(result, { reason: "disabled", sent: false });
  assert.deepEqual(logged, [{
    detail: { eventId: intake.eventId, reason: "disabled" },
    event: "crm_intake_visitor_receipt_error"
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

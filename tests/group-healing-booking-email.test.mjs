import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingConfirmationFromStripeEvent,
  sendBookingConfirmation
} from "../api/_lib/group-healing-booking-email.mjs";

function checkoutEvent(overrides = {}) {
  return {
    id: "evt_test_booking_123",
    type: "checkout.session.completed",
    created: 1787208000,
    livemode: false,
    data: {
      object: {
        id: "cs_test_booking_123",
        payment_intent: "pi_test_booking_123",
        payment_status: "paid",
        amount_total: 2000,
        currency: "usd",
        customer_details: { email: "reviewer@example.com", name: "Reviewer" },
        custom_fields: [{ key: "client_display_name", text: { value: "Reviewer" } }],
        metadata: {
          offer_key: "group-healing",
          event_id: "group-healing-2026-08-22"
        }
      }
    },
    ...overrides
  };
}

test("verified Group Healing payment builds a minimal, idempotent booking confirmation", () => {
  const message = bookingConfirmationFromStripeEvent(checkoutEvent());
  assert.equal(message.alias, "rs-booking-confirmed");
  assert.equal(message.to, "reviewer@example.com");
  assert.equal(message.idempotencyKey, "stripe:evt_test_booking_123:booking-confirmed");
  assert.equal(message.variables.EVENT_TITLE, "Grounding & Renewal");
  assert.match(message.variables.CALENDAR_URL, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(message.variables.LOCATION, /access details follow separately/i);
});

test("live, unpaid, or unknown events cannot create a booking confirmation", () => {
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({ livemode: true })), /test-mode/);
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({
    data: { object: { ...checkoutEvent().data.object, payment_status: "unpaid" } }
  })), /incomplete/);
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({
    data: { object: { ...checkoutEvent().data.object, metadata: { offer_key: "group-healing", event_id: "unknown-event-2026" } } }
  })), /No approved booking email catalog/);
});

test("staging booking confirmation remains restricted to the explicit Resend allowlist", async () => {
  const sent = [];
  const client = { emails: { send: async (...arguments_) => {
    sent.push(arguments_);
    return { data: { id: "email_booking_123" }, error: null };
  } } };
  const result = await sendBookingConfirmation(checkoutEvent(), {
    RESEND_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    RESEND_ALLOWED_RECIPIENTS: "reviewer@example.com",
    VERCEL_ENV: "preview"
  }, client);
  assert.deepEqual(result, { sent: true, id: "email_booking_123" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0].template.id, "rs-booking-confirmed");
  assert.equal(sent[0][1].idempotencyKey, "stripe:evt_test_booking_123:booking-confirmed");
});

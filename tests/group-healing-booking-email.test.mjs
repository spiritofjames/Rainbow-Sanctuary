import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingConfirmationFromStripeEvent,
  completedStripeEventFromCheckoutSession,
  programConfirmationFromStripeEvent,
  regenerationMaintenanceConfirmationFromStripeEvent,
  retreatBookingConfirmationFromStripeEvent,
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
        amount_total: 2200,
        currency: "usd",
        customer_details: { email: "reviewer@example.com", name: "Reviewer" },
        custom_fields: [{ key: "client_display_name", text: { value: "Reviewer" } }],
        metadata: {
          offer_key: "group-healing",
          event_id: "group-healing-2026-08-18"
        }
      }
    },
    ...overrides
  };
}

test("verified Group Healing payment builds a minimal, idempotent booking confirmation", () => {
  const message = bookingConfirmationFromStripeEvent(checkoutEvent(), { environment: { GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure" } });
  assert.equal(message.alias, "rs-booking-confirmed");
  assert.equal(message.to, "reviewer@example.com");
  assert.equal(message.idempotencyKey, "stripe-checkout:cs_test_booking_123:booking-confirmed");
  assert.equal(message.variables.EVENT_TITLE, "Grounding & Renewal");
  assert.equal(message.variables.EVENT_TIME, "9:00 PM");
  assert.match(message.variables.EVENT_DATE, /Tuesday, 18 August 2026/);
  assert.match(message.variables.CALENDAR_URL, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.equal(message.variables.LOCATION, "Online via Zoom");
  assert.match(message.variables.ACCESS_URL, /^https:\/\/rainbowsanctuary\.zoom\.us\//);
});

test("a fully discounted but Stripe-confirmed Group Healing booking still receives Zoom access", () => {
  const event = checkoutEvent({
    data: { object: {
      ...checkoutEvent().data.object,
      payment_intent: null,
      amount_subtotal: 2200,
      amount_total: 0
    } }
  });
  const message = bookingConfirmationFromStripeEvent(event, {
    environment: { GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure" }
  });
  assert.equal(message.to, "reviewer@example.com");
  assert.match(message.variables.ACCESS_URL, /^https:\/\/rainbowsanctuary\.zoom\.us\//);
});

test("verified Regeneration Maintenance payment builds a commitment-specific confirmation", () => {
  const event = checkoutEvent({
    data: {
      object: {
        ...checkoutEvent().data.object,
        amount_total: 21_000,
        metadata: {
          offer_key: "regeneration-maintenance-monthly",
          event_id: "regeneration-maintenance-2026-08-17-monthly"
        }
      }
    }
  });
  const message = regenerationMaintenanceConfirmationFromStripeEvent(event);
  assert.equal(message.alias, "rs-regeneration-maintenance-confirmed");
  assert.equal(message.variables.EVENT_TIME, "11:00 PM");
  assert.match(message.variables.EVENT_DATE, /Monday, 17 August 2026/);
  assert.equal(message.variables.PROGRAM_NAME, "ReGeneration Maintenance — Four-Week Opening Cycle");
  assert.equal(message.variables.COMMITMENT, "One-month commitment");
  assert.deepEqual(message.variables.SESSION_DATES.split("; "), [
    "Monday, 17 August 2026", "Monday, 24 August 2026", "Monday, 31 August 2026", "Monday, 7 September 2026"
  ]);
});

test("three-month Maintenance confirmation lists exactly twelve purchased Monday dates", () => {
  const event = checkoutEvent({
    data: {
      object: {
        ...checkoutEvent().data.object,
        amount_total: 63_000,
        metadata: {
          offer_key: "regeneration-maintenance-three-month",
          event_id: "regeneration-maintenance-2026-08-17-three-month"
        }
      }
    }
  });
  const message = regenerationMaintenanceConfirmationFromStripeEvent(event);
  const dates = message.variables.SESSION_DATES.split("; ");
  assert.equal(dates.length, 12);
  assert.equal(dates.at(-1), "Monday, 2 November 2026");
});

test("verified retreat booking gets an option-specific confirmation that preserves screening", () => {
  const event = checkoutEvent({
    data: {
      object: {
        ...checkoutEvent().data.object,
        amount_total: 300_000,
        metadata: {
          offer_key: "awakening-inner-light-retreat-2026-early-bird",
          event_id: "awakening-inner-light-retreat-2026"
        }
      }
    }
  });
  const message = retreatBookingConfirmationFromStripeEvent(event);
  assert.equal(message.alias, "rs-retreat-booking-confirmed");
  assert.equal(message.variables.PAYMENT_OPTION, "Early Bird");
  assert.equal(message.variables.RETREAT_DATES, "1–7 October 2026");
  assert.equal(message.variables.RETREAT_LOCATION, "Bocas del Toro, Panama");
  assert.equal(message.variables.RETREAT_URL, "https://rainbowsanctuary.life/awakening-your-inner-light-2026");
  assert.equal(message.idempotencyKey, "stripe-checkout:cs_test_booking_123:retreat-booking-confirmed");
});

test("verified programme payment builds a minimal programme confirmation", () => {
  const event = checkoutEvent({
    data: {
      object: {
        ...checkoutEvent().data.object,
        amount_total: 94_000,
        metadata: {
          offer_key: "crystal-healing",
          event_id: "program-crystal-healing"
        }
      }
    }
  });
  const message = programConfirmationFromStripeEvent(event);
  assert.equal(message.alias, "rs-program-enrollment-confirmed");
  assert.equal(message.variables.PROGRAM_NAME, "Crystal Healing");
  assert.equal(message.variables.START_DATE, "Schedule confirmed separately");
  assert.equal(
    message.idempotencyKey,
    "stripe-checkout:cs_test_booking_123:program-enrollment-confirmed"
  );
});

test("unapproved live, unpaid, or unknown events cannot create a booking confirmation", () => {
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({ livemode: true })), /approved Stripe Checkout/);
  assert.doesNotThrow(() => bookingConfirmationFromStripeEvent(checkoutEvent({ livemode: true }), { allowLive: true, environment: { GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure" } }));
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({
    data: { object: { ...checkoutEvent().data.object, payment_status: "unpaid" } }
  })), /incomplete/);
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({
    data: { object: { ...checkoutEvent().data.object, metadata: { offer_key: "group-healing", event_id: "unknown-event-2026" } } }
  })), /No approved booking email catalog/);
  assert.throws(() => bookingConfirmationFromStripeEvent(checkoutEvent({
    data: { object: { ...checkoutEvent().data.object, amount_total: 2_201 } }
  })), /does not match/);
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
    VERCEL_ENV: "preview",
    GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure"
  }, client);
  assert.deepEqual(result, { sent: true, id: "email_booking_123" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0].template, undefined);
  assert.equal(sent[0][0].subject, "Your Rainbow Sanctuary booking is confirmed");
  assert.equal(sent[0][1].idempotencyKey, "stripe-checkout:cs_test_booking_123:booking-confirmed");
});

test("reconciliation builds a stable completed event from the original Checkout Session", () => {
  const session = checkoutEvent().data.object;
  const event = completedStripeEventFromCheckoutSession(session);
  assert.equal(event.type, "checkout.session.completed");
  assert.equal(event.data.object, session);
  const message = bookingConfirmationFromStripeEvent(event, {
    environment: { GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure" }
  });
  assert.equal(message.idempotencyKey, "stripe-checkout:cs_test_booking_123:booking-confirmed");
});

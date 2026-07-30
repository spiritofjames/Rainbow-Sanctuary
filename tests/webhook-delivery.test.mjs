import test from "node:test";
import assert from "node:assert/strict";
import {
  forwardStripeEvent,
  safeStripeEvent,
  signaturesMatch
} from "../api/_lib/webhook-delivery.mjs";

const checkoutEvent = {
  id: "evt_test_123",
  type: "checkout.session.completed",
  created: 1785376800,
  livemode: false,
  data: {
    object: {
      id: "cs_test_123",
      customer_details: { email: "private@example.com", name: "Private Person" },
      payment_intent: "pi_test_123",
      payment_status: "paid",
      amount_total: 2000,
      currency: "usd",
      metadata: {
        event_id: "group-healing-2026-08-22",
        offer_key: "group-healing"
      }
    }
  }
};

test("the CRM envelope excludes customer PII", () => {
  const payload = safeStripeEvent(checkoutEvent);
  assert.equal(payload.stripe_event_id, "evt_test_123");
  assert.equal(payload.event_id, "group-healing-2026-08-22");
  assert.equal(payload.amount_total, 2000);
  assert.equal(JSON.stringify(payload).includes("private@example.com"), false);
  assert.equal(JSON.stringify(payload).includes("Private Person"), false);
});

test("sandbox events can be verified without forwarding while CRM is governed off", async () => {
  assert.deepEqual(await forwardStripeEvent(checkoutEvent, {}), {
    forwarded: false,
    ignored: false
  });
});

test("live payment events fail closed if CRM delivery is absent", async () => {
  await assert.rejects(
    () => forwardStripeEvent({ ...checkoutEvent, livemode: true }, {}),
    /not configured/
  );
});

test("CRM delivery is signed and uses Stripe event id for idempotency", async () => {
  let sent;
  const fakeFetch = async (url, options) => {
    sent = { url, options };
    return { ok: true, status: 200 };
  };
  const result = await forwardStripeEvent(checkoutEvent, {
    CRM_STRIPE_EVENT_URL: "https://crm.example.test/payment-events",
    CRM_STRIPE_EVENT_SECRET: "shared-test-secret"
  }, fakeFetch);
  assert.equal(result.forwarded, true);
  assert.equal(sent.options.headers["x-rainbow-event-id"], "evt_test_123");
  assert.equal(
    signaturesMatch(
      sent.options.body,
      "shared-test-secret",
      sent.options.headers["x-rainbow-signature"]
    ),
    true
  );
});

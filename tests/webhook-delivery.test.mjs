import test from "node:test";
import assert from "node:assert/strict";
import {
  crmPaymentHandoff,
  forwardStripeEvent,
  isInternalPaymentTest,
  livePaymentProcessingAllowed,
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
      custom_fields: [{
        key: "client_display_name",
        text: { value: "Generated Client" },
        type: "text"
      }],
      payment_intent: "pi_test_123",
      payment_status: "paid",
      amount_total: 2200,
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
  assert.equal(payload.amount_total, 2200);
  assert.equal(JSON.stringify(payload).includes("private@example.com"), false);
  assert.equal(JSON.stringify(payload).includes("Private Person"), false);
});

test("the strict CRM handoff includes only the client identity needed for operations", () => {
  assert.deepEqual(crmPaymentHandoff(checkoutEvent), {
    amountMinor: 2200,
    bookingReference: "cs_test_123",
    currency: "USD",
    customer: {
      displayName: "Generated Client",
      email: "private@example.com"
    },
    eventId: "evt_test_123",
    occurredAt: "2026-07-30T02:00:00.000Z",
    offerId: "group-healing",
    providerPaymentId: "pi_test_123",
    schemaVersion: "rainbow.payment-handoff.v1",
    sessionId: "group-healing-2026-08-22",
    stripeEventId: "evt_test_123"
  });
});

test("CRM handoff rejects unapproved live, unpaid or incomplete client events", () => {
  assert.throws(() => crmPaymentHandoff({ ...checkoutEvent, livemode: true }), /approved Stripe Checkout/);
  assert.doesNotThrow(() => crmPaymentHandoff({ ...checkoutEvent, livemode: true }, { allowLive: true }));
  assert.throws(() => crmPaymentHandoff({
    ...checkoutEvent,
    data: { object: { ...checkoutEvent.data.object, payment_status: "unpaid" } }
  }), /incomplete/);
  assert.throws(() => crmPaymentHandoff({
    ...checkoutEvent,
    data: {
      object: {
        ...checkoutEvent.data.object,
        customer_details: { email: "", name: "" },
        custom_fields: []
      }
    }
  }), /incomplete/);
});

test("live CRM forwarding is available only to the approved production webhook", () => {
  assert.equal(livePaymentProcessingAllowed({
    VERCEL_ENV: "production",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true",
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_WEBHOOK_SECRET: "a-webhook-secret-that-is-long-enough-for-production"
  }), true);
  assert.equal(livePaymentProcessingAllowed({
    VERCEL_ENV: "preview",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true",
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_WEBHOOK_SECRET: "a-webhook-secret-that-is-long-enough-for-production"
  }), false);
});

test("internal payment test events never enter the CRM handoff", async () => {
  const event = {
    ...checkoutEvent,
    livemode: true,
    data: { object: { ...checkoutEvent.data.object, metadata: {
      ...checkoutEvent.data.object.metadata,
      internal_payment_test: "true"
    } } }
  };
  assert.equal(isInternalPaymentTest(event), true);
  assert.deepEqual(await forwardStripeEvent(event, {
    VERCEL_ENV: "production",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true",
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_WEBHOOK_SECRET: "a-webhook-secret-that-is-long-enough-for-production"
  }), { forwarded: false, ignored: true });
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

test("CRM delivery requires HTTPS and a strong distinct handoff secret", async () => {
  await assert.rejects(
    () => forwardStripeEvent(checkoutEvent, {
      CRM_STRIPE_EVENT_URL: "http://crm.example.test/payment-events",
      CRM_STRIPE_EVENT_SECRET: "shared-test-secret-that-is-long-enough"
    }),
    /configuration is invalid/
  );
  await assert.rejects(
    () => forwardStripeEvent(checkoutEvent, {
      CRM_STRIPE_EVENT_URL: "https://crm.example.test/payment-events",
      CRM_STRIPE_EVENT_SECRET: "too-short"
    }),
    /configuration is invalid/
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
    CRM_STRIPE_EVENT_SECRET: "shared-test-secret-that-is-long-enough"
  }, fakeFetch, () => 1785376810);
  assert.equal(result.forwarded, true);
  assert.equal(sent.options.headers["x-rainbow-event-id"], "evt_test_123");
  assert.match(
    sent.options.headers["x-rainbow-payment-signature"],
    /^t=1785376810,v1=[a-f0-9]{64}$/
  );
  const signature = sent.options.headers["x-rainbow-payment-signature"].split("v1=")[1];
  assert.equal(
    signaturesMatch(
      `1785376810.${sent.options.body}`,
      "shared-test-secret-that-is-long-enough",
      signature
    ),
    true
  );
});

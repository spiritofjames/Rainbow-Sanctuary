import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAllowedOrigin,
  assertCheckoutConfiguration,
  checkoutSessionParameters,
  validateCheckoutRequest
} from "../api/_lib/checkout-policy.mjs";

const requestId = "7fc6a4ba-6f9a-4a7e-9e98-ef0b7bf9379e";

test("only explicitly opened event identifiers are accepted", () => {
  const environment = {
    STRIPE_ALLOWED_GROUP_EVENT_IDS: "group-healing-2026-08-22",
    STRIPE_ALLOWED_OFFER_IDS: "group-healing"
  };
  const result = validateCheckoutRequest(
    { eventId: "group-healing-2026-08-22", requestId },
    environment
  );
  assert.equal(result.eventId, "group-healing-2026-08-22");
  assert.equal(result.offerId, "group-healing");
  assert.equal(result.requestId, requestId);
  assert.equal(result.offer.amountMinor, 2_200);
  assert.throws(
    () => validateCheckoutRequest({ eventId: "group-healing-unlisted", requestId }, environment),
    /not open/
  );
});

test("the server owns the Stripe price and amount", () => {
  const { offer } = validateCheckoutRequest({
    eventId: "group-healing-2026-08-22",
    offerId: "group-healing",
    requestId
  }, {
    STRIPE_ALLOWED_GROUP_EVENT_IDS: "group-healing-2026-08-22",
    STRIPE_ALLOWED_OFFER_IDS: "group-healing"
  });
  const parameters = checkoutSessionParameters({
    eventId: "group-healing-2026-08-22",
    offer,
    origin: "https://staging.rainbowsanctuary.life"
  });
  assert.equal(parameters.line_items[0].price_data.unit_amount, 2_200);
  assert.equal(parameters.line_items[0].price_data.currency, "usd");
  assert.equal(parameters.client_reference_id, "group-healing-2026-08-22");
  assert.equal(parameters.metadata.event_id, "group-healing-2026-08-22");
  assert.equal(parameters.metadata.policy_key, "group-healing");
  assert.match(parameters.custom_text.submit.message, /non-refundable/i);
  assert.match(parameters.custom_text.submit.message, /one reschedule/i);
  assert.match(parameters.custom_text.submit.message, /non-transferable/i);
  assert.deepEqual(parameters.custom_fields, [{
    key: "client_display_name",
    label: { custom: "Full name", type: "custom" },
    optional: false,
    type: "text"
  }]);
  assert.equal(parameters.success_url, "https://staging.rainbowsanctuary.life/payment-confirmation?payment=confirmed&session_id={CHECKOUT_SESSION_ID}");
  assert.equal(parameters.cancel_url, "https://staging.rainbowsanctuary.life/online-group-healing?checkout=cancelled");
});

test("Regeneration Maintenance uses one of two fixed server-owned commitments", () => {
  const environment = {
    STRIPE_ALLOWED_OFFER_IDS: "regeneration-maintenance-monthly,regeneration-maintenance-three-month"
  };
  const result = validateCheckoutRequest({
    offerId: "regeneration-maintenance-monthly",
    eventId: "regeneration-maintenance-2026-08-17-monthly",
    requestId
  }, environment);
  assert.equal(result.offer.amountMinor, 21_000);
  assert.equal(result.eventId, "regeneration-maintenance-2026-08-17-monthly");
  assert.throws(() => validateCheckoutRequest({
    offerId: "regeneration-maintenance-monthly",
    eventId: "regeneration-maintenance-unlisted",
    requestId
  }, environment), /Invalid programme payment reference/);
  const parameters = checkoutSessionParameters({
    eventId: result.eventId,
    offer: result.offer,
    origin: "https://staging.rainbowsanctuary.life"
  });
  assert.equal(parameters.line_items[0].price_data.unit_amount, 21_000);
  assert.match(parameters.custom_text.submit.message, /Level I and Level II/);
  assert.match(parameters.custom_text.submit.message, /one-time payment/i);
});

test("live keys are rejected outside production", () => {
  assert.throws(() => assertCheckoutConfiguration({
    STRIPE_CHECKOUT_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_live_example",
    VERCEL_ENV: "preview"
  }), /not permitted/);
  assert.throws(() => assertCheckoutConfiguration({
    STRIPE_CHECKOUT_ENABLED: "true",
    STRIPE_SECRET_KEY: "rk_live_example",
    VERCEL_ENV: "preview"
  }), /not permitted/);
});

test("production requires a live key and explicit approval", () => {
  const base = {
    STRIPE_CHECKOUT_ENABLED: "true",
    VERCEL_ENV: "production"
  };
  assert.throws(
    () => assertCheckoutConfiguration({ ...base, STRIPE_SECRET_KEY: "sk_test_example" }),
    /not been approved/
  );
  assert.doesNotThrow(() => assertCheckoutConfiguration({
    ...base,
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true",
    STRIPE_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_TAX_DISPLAY_APPROVED: "true"
  }));
  assert.doesNotThrow(() => assertCheckoutConfiguration({
    ...base,
    STRIPE_SECRET_KEY: "rk_live_example",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true",
    STRIPE_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_TAX_DISPLAY_APPROVED: "true"
  }));
});

test("tax-inclusive Checkout is enabled only through the governed tax gate", () => {
  const { offer } = validateCheckoutRequest({
    offerId: "crystal-healing",
    requestId
  }, {
    STRIPE_ALLOWED_OFFER_IDS: "crystal-healing"
  });
  const withoutTax = checkoutSessionParameters({
    eventId: offer.sessionId,
    offer,
    origin: "https://staging.rainbowsanctuary.life"
  });
  assert.equal(withoutTax.automatic_tax, undefined);
  assert.equal(withoutTax.line_items[0].price_data.tax_behavior, undefined);

  const withTax = checkoutSessionParameters({
    eventId: offer.sessionId,
    offer,
    origin: "https://staging.rainbowsanctuary.life",
    taxEnabled: true
  });
  assert.deepEqual(withTax.automatic_tax, { enabled: true });
  assert.equal(withTax.line_items[0].price_data.tax_behavior, "inclusive");
});

test("internal checkout test is separately allowlisted and cannot become a public group booking", () => {
  const { offer, eventId } = validateCheckoutRequest({
    offerId: "internal-payment-test",
    requestId
  }, {
    STRIPE_ALLOWED_OFFER_IDS: "internal-payment-test"
  });
  const parameters = checkoutSessionParameters({
    eventId,
    offer,
    origin: "https://rainbowsanctuary.life",
    taxEnabled: true
  });
  assert.equal(parameters.line_items[0].price_data.unit_amount, 100);
  assert.equal(parameters.metadata.internal_payment_test, "true");
  assert.match(parameters.success_url, /payment-confirmation\?payment=confirmed/);
  assert.match(parameters.success_url, /internal_test=1/);
  assert.match(parameters.custom_text.submit.message, /internal payment-system verification/i);
});

test("programme checkout uses only the allowlisted server catalogue variant", () => {
  const result = validateCheckoutRequest({
    offerId: "crystal-healing",
    requestId
  }, {
    STRIPE_ALLOWED_OFFER_IDS: "crystal-healing"
  });
  assert.equal(result.eventId, "program-crystal-healing");
  assert.equal(result.offer.amountMinor, 94_000);
  assert.throws(() => validateCheckoutRequest({
    offerId: "spiral-i-standard",
    requestId
  }, {
    STRIPE_ALLOWED_OFFER_IDS: "crystal-healing"
  }), /not open/);
  assert.throws(() => validateCheckoutRequest({
    offerId: "crystal-healing",
    eventId: "program-another-session",
    requestId
  }, {
    STRIPE_ALLOWED_OFFER_IDS: "crystal-healing"
  }), /Invalid programme/);
});

test("origins must be explicitly allowed or match the current HTTPS request host", () => {
  const environment = {
    STRIPE_ALLOWED_CHECKOUT_ORIGINS: "https://staging.rainbowsanctuary.life",
    VERCEL_ENV: "preview"
  };
  assert.equal(assertAllowedOrigin({
    headers: { origin: "https://staging.rainbowsanctuary.life", host: "other.vercel.app" }
  }, environment), "https://staging.rainbowsanctuary.life");
  assert.equal(assertAllowedOrigin({
    headers: { origin: "https://rainbow-pr-12.vercel.app", host: "rainbow-pr-12.vercel.app" }
  }, environment), "https://rainbow-pr-12.vercel.app");
  assert.equal(assertAllowedOrigin({
    headers: { origin: "https://rainbowsanctuary.life", host: "rainbowsanctuary.life" }
  }, { VERCEL_ENV: "production" }), "https://rainbowsanctuary.life");
  assert.throws(() => assertAllowedOrigin({
    headers: { origin: "https://attacker.example", host: "rainbow-pr-12.vercel.app" }
  }, environment), /not allowed/);
});

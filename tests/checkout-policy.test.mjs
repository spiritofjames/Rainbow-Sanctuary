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
    STRIPE_ALLOWED_GROUP_EVENT_IDS: "group-healing-2026-08-22"
  };
  assert.deepEqual(
    validateCheckoutRequest({ eventId: "group-healing-2026-08-22", requestId }, environment),
    { eventId: "group-healing-2026-08-22", requestId }
  );
  assert.throws(
    () => validateCheckoutRequest({ eventId: "group-healing-unlisted", requestId }, environment),
    /not open/
  );
});

test("the server owns the Stripe price and amount", () => {
  const parameters = checkoutSessionParameters({
    eventId: "group-healing-2026-08-22",
    origin: "https://staging.rainbowsanctuary.life",
    priceId: "price_server_owned"
  });
  assert.deepEqual(parameters.line_items, [{ price: "price_server_owned", quantity: 1 }]);
  assert.equal(parameters.client_reference_id, "group-healing-2026-08-22");
  assert.equal(parameters.metadata.event_id, "group-healing-2026-08-22");
  assert.deepEqual(parameters.custom_fields, [{
    key: "client_display_name",
    label: { custom: "Full name", type: "custom" },
    optional: false,
    type: "text"
  }]);
  assert.match(parameters.success_url, /^https:\/\/staging\.rainbowsanctuary\.life\//);
});

test("live keys are rejected outside production", () => {
  assert.throws(() => assertCheckoutConfiguration({
    STRIPE_CHECKOUT_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_GROUP_HEALING_PRICE_ID: "price_example",
    VERCEL_ENV: "preview"
  }), /not permitted/);
});

test("production requires a live key and explicit approval", () => {
  const base = {
    STRIPE_CHECKOUT_ENABLED: "true",
    STRIPE_GROUP_HEALING_PRICE_ID: "price_example",
    VERCEL_ENV: "production"
  };
  assert.throws(
    () => assertCheckoutConfiguration({ ...base, STRIPE_SECRET_KEY: "sk_test_example" }),
    /not been approved/
  );
  assert.doesNotThrow(() => assertCheckoutConfiguration({
    ...base,
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_LIVE_CHECKOUT_APPROVED: "true"
  }));
});

test("origins must be explicitly allowed or match the current Vercel preview host", () => {
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
  assert.throws(() => assertAllowedOrigin({
    headers: { origin: "https://attacker.example", host: "rainbow-pr-12.vercel.app" }
  }, environment), /not allowed/);
});

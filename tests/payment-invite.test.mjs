import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedStaffOfferIds,
  paymentInviteSignature,
  paymentInviteSignatureMatches
} from "../api/_lib/payment-invite.mjs";
import { assertAllowedPaymentInviteOrigin } from "../api/_lib/checkout-policy.mjs";

const SECRET = "a-distinct-test-signing-secret-that-is-long-enough";

test("staff payment invitations are deterministic and tamper evident", () => {
  const signature = paymentInviteSignature("spiral-i-standard", SECRET);
  assert.match(signature, /^[a-f0-9]{64}$/);
  assert.equal(paymentInviteSignatureMatches("spiral-i-standard", SECRET, signature), true);
  assert.equal(paymentInviteSignatureMatches("spiral-i-early-bird", SECRET, signature), false);
  assert.equal(paymentInviteSignatureMatches("spiral-i-standard", SECRET, "bad"), false);
});

test("staff payment options use a separate exact allowlist", () => {
  const allowed = allowedStaffOfferIds({
    STRIPE_STAFF_PAYMENT_OFFER_IDS: "spiral-i-standard, spiral-i-early-bird"
  });
  assert.deepEqual([...allowed], ["spiral-i-standard", "spiral-i-early-bird"]);
  assert.equal(allowed.has("group-healing"), false);
});

test("invalid identifiers and weak secrets fail closed", () => {
  assert.throws(() => paymentInviteSignature("bad id", SECRET), /invalid/);
  assert.throws(() => paymentInviteSignature("spiral-i-standard", "weak"), /invalid/);
});

test("staff payment link accepts the governed staging host without an Origin header", () => {
  const origin = assertAllowedPaymentInviteOrigin({
    headers: {
      host: "staging.rainbowsanctuary.life",
      "x-forwarded-proto": "https"
    }
  }, {
    VERCEL_ENV: "preview",
    STRIPE_ALLOWED_CHECKOUT_ORIGINS: "https://staging.rainbowsanctuary.life"
  });
  assert.equal(origin, "https://staging.rainbowsanctuary.life");
});

test("staff payment link rejects an unapproved host", () => {
  assert.throws(() => assertAllowedPaymentInviteOrigin({
    headers: { host: "attacker.example", "x-forwarded-proto": "https" }
  }, {
    VERCEL_ENV: "staging",
    STRIPE_ALLOWED_CHECKOUT_ORIGINS: "https://staging.rainbowsanctuary.life"
  }), /not allowed/);
});

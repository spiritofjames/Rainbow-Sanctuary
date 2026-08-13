import test from "node:test";
import assert from "node:assert/strict";
import {
  feeInclusiveAmountMinor,
  OFFER_CATALOG,
  resolveOfferVariant
} from "../api/_lib/offer-catalog.mjs";

test("the internal processing allowance grosses up and rounds customer prices", () => {
  assert.equal(feeInclusiveAmountMinor(2_000, { roundingMinor: 100 }), 2_200);
  assert.equal(feeInclusiveAmountMinor(89_900), 94_000);
  assert.equal(feeInclusiveAmountMinor(739_900), 771_000);
});

test("every direct payment variant has a stable identity and server-owned USD amount", () => {
  const variants = OFFER_CATALOG.flatMap((entry) => entry.variants);
  assert.equal(variants.length, 20);
  assert.equal(new Set(variants.map((entry) => entry.id)).size, variants.length);
  for (const entry of variants) {
    assert.match(entry.id, /^[a-z0-9][a-z0-9-]+$/);
    assert.match(entry.sessionId, /^[a-z0-9][a-z0-9-]+$/);
    assert.equal(entry.currency, "usd");
    assert.equal(Number.isInteger(entry.amountMinor), true);
    assert.equal(entry.amountMinor >= entry.baseAmountMinor, true);
  }
});

test("unknown payment variants fail closed", () => {
  assert.equal(resolveOfferVariant("group-healing").amountMinor, 2_200);
  assert.throws(() => resolveOfferVariant("unknown-offer"), /not available/);
  assert.throws(() => resolveOfferVariant("bad id"), /Invalid/);
});

test("the internal live checkout test is isolated and fixed at one dollar", () => {
  const testOffer = resolveOfferVariant("internal-payment-test");
  assert.equal(testOffer.amountMinor, 100);
  assert.equal(testOffer.internalPaymentTest, true);
  assert.equal(testOffer.policy, "internal-test");
});

test("Regeneration Maintenance has two fixed server-owned commitment prices", () => {
  const monthly = resolveOfferVariant("regeneration-maintenance-monthly");
  const threeMonth = resolveOfferVariant("regeneration-maintenance-three-month");
  assert.equal(monthly.amountMinor, 21_000);
  assert.equal(threeMonth.amountMinor, 63_000);
  assert.equal(monthly.policy, "regeneration-maintenance");
  assert.equal(threeMonth.policy, "regeneration-maintenance");
  assert.equal(monthly.offer.pagePath, "/144-stages-maintenance");
});

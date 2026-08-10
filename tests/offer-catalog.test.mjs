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
  assert.equal(variants.length, 17);
  assert.equal(new Set(variants.map((entry) => entry.id)).size, variants.length);
  for (const entry of variants) {
    assert.match(entry.id, /^[a-z0-9][a-z0-9-]+$/);
    assert.match(entry.sessionId, /^[a-z0-9][a-z0-9-]+$/);
    assert.equal(entry.currency, "usd");
    assert.equal(Number.isInteger(entry.amountMinor), true);
    assert.equal(entry.amountMinor > entry.baseAmountMinor, true);
  }
});

test("unknown payment variants fail closed", () => {
  assert.equal(resolveOfferVariant("group-healing").amountMinor, 2_200);
  assert.throws(() => resolveOfferVariant("unknown-offer"), /not available/);
  assert.throws(() => resolveOfferVariant("bad id"), /Invalid/);
});

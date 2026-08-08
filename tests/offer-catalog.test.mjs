import test from "node:test";
import assert from "node:assert/strict";
import {
  feeInclusiveAmountMinor,
  OFFER_CATALOG,
  publicOfferCatalog,
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

test("the public catalogue exposes no Stripe identifiers or internal base amounts", () => {
  const catalog = publicOfferCatalog({
    STRIPE_ALLOWED_OFFER_IDS: "group-healing,crystal-healing"
  });
  const serialized = JSON.stringify(catalog);
  assert.equal(serialized.includes("baseAmountMinor"), false);
  assert.equal(serialized.includes("price_"), false);
  assert.equal(
    catalog.find((entry) => entry.id === "crystal-healing").variants[0].checkoutAvailable,
    true
  );
  assert.equal(catalog.some((entry) => entry.id === "spiral-i"), false);
});

test("an application-first offer is absent unless one of its variants is explicitly opened", () => {
  const publicCatalog = publicOfferCatalog({
    STRIPE_ALLOWED_OFFER_IDS: "group-healing,crystal-healing"
  });
  assert.equal(
    publicCatalog.some((entry) => entry.id === "childrens-potential-coach-certification"),
    false
  );
});

test("unknown payment variants fail closed", () => {
  assert.equal(resolveOfferVariant("group-healing").amountMinor, 2_200);
  assert.throws(() => resolveOfferVariant("unknown-offer"), /not available/);
  assert.throws(() => resolveOfferVariant("bad id"), /Invalid/);
});

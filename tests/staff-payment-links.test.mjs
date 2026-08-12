import assert from "node:assert/strict";
import test from "node:test";
import {
  hydrateStaffPaymentLinkEvent,
  staffPaymentLinkContext,
  staffPaymentLinkMap
} from "../api/_lib/staff-payment-links.mjs";

const environment = {
  STRIPE_STAFF_PAYMENT_LINK_MAP: "plink_1Example:spiral-i-standard,plink_2Example:spiral-i-early-bird,malformed,plink_invalid:no-such-offer"
};

test("accepts only explicitly configured Stripe Dashboard payment links", () => {
  const mapped = staffPaymentLinkMap(environment);
  assert.equal(mapped.size, 2);
  assert.equal(mapped.get("plink_1Example")?.id, "spiral-i-standard");
  assert.equal(staffPaymentLinkContext({ payment_link: "plink_1Example", metadata: {} }, environment)?.eventId, "program-spiral-i-standard");
  assert.equal(staffPaymentLinkContext({ payment_link: "plink_unknown", metadata: {} }, environment), null);
});

test("does not override first-party Checkout metadata", () => {
  assert.equal(staffPaymentLinkContext({
    payment_link: "plink_1Example",
    metadata: { offer_key: "group-healing" }
  }, environment), null);
});

test("hydrates an allowed Stripe Dashboard payment event for the governed webhook", () => {
  const event = hydrateStaffPaymentLinkEvent({
    data: { object: { payment_link: "plink_2Example", metadata: {} } }
  }, environment);
  assert.deepEqual(event.data.object.metadata, {
    event_id: "program-spiral-i-early-bird",
    offer_key: "spiral-i-early-bird",
    policy_key: "program-purchase",
    source: "rainbow-sanctuary-staff-payment-link"
  });
});

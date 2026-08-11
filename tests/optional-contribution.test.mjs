import assert from "node:assert/strict";
import test from "node:test";
import { isOptionalContributionSession } from "../api/_lib/optional-contribution.mjs";

const paymentLinkId = "plink_1U34gMHrqlaOfUb7Ftu9QoG6";

test("marks a first-party Checkout contribution by explicit metadata", () => {
  assert.equal(isOptionalContributionSession({ metadata: { contribution: "true" } }, {}), true);
});

test("marks the approved Stripe-hosted contribution payment link", () => {
  assert.equal(
    isOptionalContributionSession({ payment_link: paymentLinkId }, {}),
    true
  );
});

test("does not classify an unrelated or malformed payment link as a contribution", () => {
  assert.equal(isOptionalContributionSession({ payment_link: "plink_other" }, { STRIPE_OPTIONAL_CONTRIBUTION_PAYMENT_LINK_ID: paymentLinkId }), false);
  assert.equal(isOptionalContributionSession({ payment_link: "plink_unrelated" }, { STRIPE_OPTIONAL_CONTRIBUTION_PAYMENT_LINK_ID: "not-a-stripe-id" }), false);
});

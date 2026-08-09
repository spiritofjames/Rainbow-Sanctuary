import { createHmac, timingSafeEqual } from "node:crypto";

const OFFER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;

export function paymentInviteSignature(offerId, secret, version = "v1") {
  if (!OFFER_ID_PATTERN.test(String(offerId || "")) || String(secret || "").length < 32) {
    throw new Error("Payment invitation configuration is invalid.");
  }
  return createHmac("sha256", secret).update(`${version}:${offerId}`).digest("hex");
}

export function paymentInviteSignatureMatches(offerId, secret, candidate, version = "v1") {
  const expected = Buffer.from(paymentInviteSignature(offerId, secret, version), "hex");
  const received = Buffer.from(String(candidate || ""), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function allowedStaffOfferIds(environment = {}) {
  return new Set(
    String(environment.STRIPE_STAFF_PAYMENT_OFFER_IDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

import { resolveOfferVariant } from "./offer-catalog.mjs";

const PAYMENT_LINK_ID_PATTERN = /^plink_[A-Za-z0-9]+$/;

/**
 * Maps Stripe Dashboard Payment Link IDs to server-owned offer variants.
 *
 * Environment format:
 * STRIPE_STAFF_PAYMENT_LINK_MAP=plink_abc:spiral-i-standard,plink_def:spiral-i-early-bird
 *
 * This intentionally has no wildcard. An unknown Stripe Payment Link never
 * becomes a Rainbow programme payment merely because it shares the account.
 */
export function staffPaymentLinkMap(environment = {}) {
  const result = new Map();
  const entries = String(environment.STRIPE_STAFF_PAYMENT_LINK_MAP || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const separator = entry.indexOf(":");
    const paymentLinkId = entry.slice(0, separator).trim();
    const offerId = entry.slice(separator + 1).trim();
    if (separator < 1 || !PAYMENT_LINK_ID_PATTERN.test(paymentLinkId)) continue;
    try {
      result.set(paymentLinkId, resolveOfferVariant(offerId));
    } catch {
      // Ignore malformed configuration rather than authorizing a guessed offer.
    }
  }
  return result;
}

export function staffPaymentLinkContext(session, environment = {}) {
  const existingOfferId = String(session?.metadata?.offer_key || "");
  if (existingOfferId) return null;
  const paymentLinkId = String(session?.payment_link || "");
  const offer = staffPaymentLinkMap(environment).get(paymentLinkId);
  if (!offer) return null;
  return {
    eventId: offer.sessionId,
    offerId: offer.id,
    policyKey: offer.policy,
    source: "rainbow-sanctuary-staff-payment-link"
  };
}

export function hydrateStaffPaymentLinkEvent(event, environment = {}) {
  const session = event?.data?.object;
  const context = staffPaymentLinkContext(session, environment);
  if (!context) return event;
  return {
    ...event,
    data: {
      ...event.data,
      object: {
        ...session,
        metadata: {
          ...(session.metadata || {}),
          event_id: context.eventId,
          offer_key: context.offerId,
          policy_key: context.policyKey,
          source: context.source
        }
      }
    }
  };
}

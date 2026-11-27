import { resolveOfferVariant } from "./offer-catalog.mjs";

const PAYMENT_LINK_ID_PATTERN = /^plink_[A-Za-z0-9]+$/;
// Stripe Workbench identified this exact $500 staff link as Private Healing.
// It is not the separately offered Personal Karma Reconciliation purchase.
const PRIVATE_HEALING_LINK_ID = "plink_1UIJ2kHrqlaOfUb7aRYSFyju";
const PRIVATE_HEALING_WEBHOOK_OFFER = Object.freeze({
  id: "staff-private-healing-payment",
  name: "Private Healing",
  sessionId: "private-healing-staff-follow-up",
  amountMinor: 50000,
  policy: "private-session",
  offer: Object.freeze({ name: "Private Healing" })
});

function privateHealingWebhookOffer(session) {
  const offer = PRIVATE_HEALING_WEBHOOK_OFFER;
  if (
    session?.payment_link !== PRIVATE_HEALING_LINK_ID ||
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.currency !== "usd" ||
    session.amount_total !== offer.amountMinor ||
    (session.amount_subtotal ?? session.amount_total) !== offer.amountMinor
  ) throw new Error("Private Healing checkout does not match the approved staff payment link and amount.");
  return offer;
}

export function isPrivateHealingWebhookPayment(event) {
  return event?.data?.object?.metadata?.offer_key === PRIVATE_HEALING_WEBHOOK_OFFER.id;
}

export function resolvePaymentHandoffOffer(event, offerId) {
  return offerId === PRIVATE_HEALING_WEBHOOK_OFFER.id
    ? privateHealingWebhookOffer(event?.data?.object)
    : resolveOfferVariant(offerId);
}

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

export function hydrateStaffPaymentLinkEvent(event, environment = {}, { privateHealingWebhook = false } = {}) {
  const session = event?.data?.object;
  let context;
  if (privateHealingWebhook && session?.payment_link === PRIVATE_HEALING_LINK_ID &&
    ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const offer = privateHealingWebhookOffer(session);
    if (session.metadata?.offer_key && session.metadata.offer_key !== offer.id) {
      throw new Error("Private Healing checkout carries a conflicting offer.");
    }
    context = {
      eventId: offer.sessionId,
      offerId: offer.id,
      policyKey: offer.policy,
      source: "rainbow-sanctuary-staff-payment-link"
    };
  } else {
    context = staffPaymentLinkContext(session, environment);
  }
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

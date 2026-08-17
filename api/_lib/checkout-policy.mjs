import { resolveOfferVariant } from "./offer-catalog.mjs";
import { isApprovedGroupHealingEvent } from "./group-healing-schedule.mjs";

const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function commaSeparatedSet(value) {
  return new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean));
}

export function validateCheckoutRequest(body, environment) {
  const offerId = typeof body?.offerId === "string" && body.offerId.trim()
    ? body.offerId.trim()
    : "group-healing";
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const offer = resolveOfferVariant(offerId);
  const eventId = typeof body?.eventId === "string" && body.eventId.trim()
    ? body.eventId.trim()
    : offer.sessionId;

  if (!EVENT_ID_PATTERN.test(eventId)) throw new Error("Invalid event identifier.");
  if (!REQUEST_ID_PATTERN.test(requestId)) throw new Error("Invalid request identifier.");
  if (!commaSeparatedSet(environment.STRIPE_ALLOWED_OFFER_IDS).has(offerId)) {
    throw new Error("This payment option is not open.");
  }
  if (
    offer.policy === "group-healing" &&
    !commaSeparatedSet(environment.STRIPE_ALLOWED_GROUP_EVENT_IDS).has(eventId) &&
    !isApprovedGroupHealingEvent(eventId)
  ) {
    throw new Error("Registration is not open for this event.");
  }
  if (offer.policy !== "group-healing" && eventId !== offer.sessionId) {
    throw new Error("Invalid programme payment reference.");
  }

  return { eventId, offer, offerId, requestId };
}

export function assertCheckoutConfiguration(environment) {
  if (environment.STRIPE_CHECKOUT_ENABLED !== "true") {
    throw new Error("Checkout is not enabled.");
  }
  if (!environment.STRIPE_SECRET_KEY) {
    throw new Error("Checkout is not configured.");
  }

  const liveKey = environment.STRIPE_SECRET_KEY.startsWith("sk_live_");
  if (environment.VERCEL_ENV === "production") {
    if (
      !liveKey ||
      environment.STRIPE_LIVE_CHECKOUT_APPROVED !== "true" ||
      environment.STRIPE_AUTOMATIC_TAX_ENABLED !== "true" ||
      environment.STRIPE_TAX_DISPLAY_APPROVED !== "true"
    ) {
      throw new Error("Live checkout has not been approved.");
    }
  } else if (liveKey) {
    throw new Error("Live Stripe keys are not permitted outside production.");
  }
}

export function assertAllowedOrigin(request, environment) {
  const rawOrigin = request.headers?.origin;
  if (!rawOrigin) throw new Error("Request origin is required.");

  const origin = new URL(rawOrigin);
  const allowed = commaSeparatedSet(environment.STRIPE_ALLOWED_CHECKOUT_ORIGINS);
  if (allowed.has(origin.origin)) return origin.origin;

  const requestHost = String(request.headers?.host || "").toLowerCase();
  const isSameOrigin = origin.protocol === "https:" && origin.host.toLowerCase() === requestHost;
  if (isSameOrigin) return origin.origin;

  throw new Error("Request origin is not allowed.");
}

export function assertAllowedPaymentInviteOrigin(request, environment) {
  const forwardedHost = String(request.headers?.["x-forwarded-host"] || "").split(",")[0].trim();
  const host = (forwardedHost || String(request.headers?.host || "")).toLowerCase();
  if (!host || /[\/\s]/.test(host)) throw new Error("Request host is invalid.");

  const forwardedProtocol = String(request.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const protocol = forwardedProtocol || (host.startsWith("localhost:") ? "http" : "https");
  if (protocol !== "https" && !(protocol === "http" && host.startsWith("localhost:"))) {
    throw new Error("Secure payment invitation origin is required.");
  }

  const origin = new URL(`${protocol}://${host}`).origin;
  const allowed = commaSeparatedSet(environment.STRIPE_ALLOWED_CHECKOUT_ORIGINS);
  if (allowed.has(origin)) return origin;

  const isOwnPreview = environment.VERCEL_ENV === "preview" &&
    protocol === "https" &&
    host.endsWith(".vercel.app");
  if (isOwnPreview) return origin;

  throw new Error("Request origin is not allowed.");
}

export function configuredStripePriceId(offer, environment) {
  if (offer.policy !== "group-healing") return "";
  const priceId = String(environment.STRIPE_GROUP_HEALING_PRICE_ID || "").trim();
  if (!/^price_[a-zA-Z0-9]+$/.test(priceId)) {
    throw new Error("Dedicated Group Healing Stripe price is not configured.");
  }
  return priceId;
}

function policyMessage(offer) {
  return offer.policy === "group-healing"
    ? "This booking is non-refundable and non-transferable. You may request one reschedule to an available Group Healing session by contacting bookings@rainbowsanctuary.life at least 24 hours before the booked session. Mandatory consumer rights and organizer cancellation are unaffected."
    : "The total shown includes payment processing. Programme scheduling and participation details are confirmed separately. Mandatory consumer rights are unaffected.";
}

export function checkoutSessionParameters({ eventId, offer, origin, taxEnabled = false, priceId = "" }) {
  const priceData = {
    currency: offer.currency,
    product_data: {
      name: offer.name,
      metadata: {
        offer_key: offer.id,
        source: "rainbow-sanctuary-web"
      }
    },
    unit_amount: offer.amountMinor
  };
  if (taxEnabled) priceData.tax_behavior = "inclusive";

  const parameters = {
    mode: "payment",
    line_items: [priceId
      ? { price: priceId, quantity: 1 }
      : { price_data: priceData, quantity: 1 }
    ],
    client_reference_id: eventId,
    customer_creation: "always",
    billing_address_collection: "auto",
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      submit: { message: policyMessage(offer) }
    },
    custom_fields: [{
      key: "client_display_name",
      label: { custom: "Full name", type: "custom" },
      optional: false,
      type: "text"
    }],
    metadata: {
      offer_key: offer.id,
      event_id: eventId,
      policy_key: offer.policy,
      source: "rainbow-sanctuary-web"
    },
    payment_intent_data: {
      metadata: {
        offer_key: offer.id,
        event_id: eventId,
        policy_key: offer.policy,
        source: "rainbow-sanctuary-web"
      }
    },
    success_url: `${origin}${offer.offer.pagePath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${offer.offer.pagePath}?checkout=cancelled`
  };
  if (offer.policy === "group-healing") parameters.allow_promotion_codes = true;
  if (taxEnabled) parameters.automatic_tax = { enabled: true };
  return parameters;
}

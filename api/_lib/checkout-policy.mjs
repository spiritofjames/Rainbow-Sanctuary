const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function commaSeparatedSet(value) {
  return new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean));
}

export function validateCheckoutRequest(body, environment) {
  const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";

  if (!EVENT_ID_PATTERN.test(eventId)) throw new Error("Invalid event identifier.");
  if (!REQUEST_ID_PATTERN.test(requestId)) throw new Error("Invalid request identifier.");
  if (!commaSeparatedSet(environment.STRIPE_ALLOWED_GROUP_EVENT_IDS).has(eventId)) {
    throw new Error("Registration is not open for this event.");
  }

  return { eventId, requestId };
}

export function assertCheckoutConfiguration(environment) {
  if (environment.STRIPE_CHECKOUT_ENABLED !== "true") {
    throw new Error("Checkout is not enabled.");
  }
  if (!environment.STRIPE_SECRET_KEY || !environment.STRIPE_GROUP_HEALING_PRICE_ID) {
    throw new Error("Checkout is not configured.");
  }

  const liveKey = environment.STRIPE_SECRET_KEY.startsWith("sk_live_");
  if (environment.VERCEL_ENV === "production") {
    if (!liveKey || environment.STRIPE_LIVE_CHECKOUT_APPROVED !== "true") {
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
  const isOwnPreview = environment.VERCEL_ENV === "preview" &&
    origin.protocol === "https:" &&
    origin.hostname.toLowerCase() === requestHost &&
    origin.hostname.endsWith(".vercel.app");
  if (isOwnPreview) return origin.origin;

  throw new Error("Request origin is not allowed.");
}

export function checkoutSessionParameters({ eventId, origin, priceId }) {
  return {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: eventId,
    customer_creation: "always",
    billing_address_collection: "auto",
    consent_collection: { terms_of_service: "required" },
    metadata: {
      offer_key: "group-healing",
      event_id: eventId,
      source: "rainbow-sanctuary-web"
    },
    payment_intent_data: {
      metadata: {
        offer_key: "group-healing",
        event_id: eventId,
        source: "rainbow-sanctuary-web"
      }
    },
    success_url: `${origin}/group-healing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/group-healing?checkout=cancelled#choose-session`
  };
}

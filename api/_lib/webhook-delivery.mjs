import { createHmac, timingSafeEqual } from "node:crypto";

export const SUPPORTED_STRIPE_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "charge.refunded"
]);

const CRM_PAYMENT_HANDOFF_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded"
]);
const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{2,199}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function livePaymentProcessingAllowed(environment = {}) {
  const key = String(environment.STRIPE_SECRET_KEY || "");
  return environment.VERCEL_ENV === "production" &&
    environment.STRIPE_LIVE_CHECKOUT_APPROVED === "true" &&
    ["sk_live_", "rk_live_"].some((prefix) => key.startsWith(prefix)) &&
    String(environment.STRIPE_WEBHOOK_SECRET || "").length >= 32;
}

export function isInternalPaymentTest(event) {
  return String(event?.data?.object?.metadata?.internal_payment_test || "") === "true";
}

export function safeStripeEvent(event) {
  const object = event.data?.object || {};
  const isCheckout = event.type.startsWith("checkout.session.");
  return {
    schema_version: 1,
    stripe_event_id: event.id,
    type: event.type,
    created: event.created,
    livemode: event.livemode,
    stripe_object_id: object.id || "",
    checkout_session_id: isCheckout ? object.id || "" : "",
    payment_intent_id: isCheckout
      ? (typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id || "")
      : (typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id || ""),
    event_id: object.metadata?.event_id || "",
    offer_key: object.metadata?.offer_key || "",
    payment_status: object.payment_status || "",
    amount_total: object.amount_total ?? object.amount_refunded ?? null,
    currency: object.currency || ""
  };
}

export function signPayload(body, secret) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function signaturesMatch(body, secret, candidate) {
  const expected = Buffer.from(signPayload(body, secret), "hex");
  const received = Buffer.from(String(candidate || ""), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function checkoutDisplayName(object) {
  const customName = object.custom_fields?.find(
    (field) => field.key === "client_display_name"
  )?.text?.value;
  return String(customName || object.customer_details?.name || "").trim();
}

export function crmPaymentHandoff(event, { allowLive = false } = {}) {
  if (!CRM_PAYMENT_HANDOFF_EVENTS.has(event.type) || (event.livemode && !allowLive)) {
    throw new Error("Only approved Stripe Checkout events can enter the CRM.");
  }

  const object = event.data?.object || {};
  const customerEmail = String(object.customer_details?.email || "").trim().toLowerCase();
  const customerDisplayName = checkoutDisplayName(object);
  const paymentIntentId = typeof object.payment_intent === "string"
    ? object.payment_intent
    : object.payment_intent?.id || "";
  const offerId = String(object.metadata?.offer_key || "");
  const sessionId = String(object.metadata?.event_id || "");
  const identifiers = [event.id, object.id, paymentIntentId, offerId, sessionId];

  if (
    object.payment_status !== "paid" ||
    !Number.isInteger(object.amount_total) ||
    object.amount_total <= 0 ||
    String(object.currency || "").toLowerCase() !== "usd" ||
    !EMAIL_PATTERN.test(customerEmail) ||
    customerDisplayName.length < 1 ||
    customerDisplayName.length > 160 ||
    identifiers.some((value) => !IDENTIFIER_PATTERN.test(value)) ||
    !Number.isInteger(event.created)
  ) {
    throw new Error("Stripe Checkout event is incomplete for the CRM handoff.");
  }

  return {
    amountMinor: object.amount_total,
    bookingReference: object.id,
    currency: "USD",
    customer: {
      displayName: customerDisplayName,
      email: customerEmail
    },
    eventId: event.id,
    occurredAt: new Date(event.created * 1000).toISOString(),
    offerId,
    providerPaymentId: paymentIntentId,
    schemaVersion: "rainbow.payment-handoff.v1",
    sessionId,
    stripeEventId: event.id
  };
}

export async function forwardStripeEvent(
  event,
  environment,
  fetchImplementation = fetch,
  clockSeconds = () => Math.floor(Date.now() / 1000)
) {
  if (!SUPPORTED_STRIPE_EVENTS.has(event.type)) return { forwarded: false, ignored: true };
  if (isInternalPaymentTest(event)) return { forwarded: false, ignored: true };

  const endpoint = environment.CRM_STRIPE_EVENT_URL;
  const secret = environment.CRM_STRIPE_EVENT_SECRET;
  if (!endpoint || !secret) {
    // HubSpot is the live operating CRM. The legacy PSN gateway is an optional
    // mirror while it remains available; it must not prevent a verified payment
    // from reaching the team in HubSpot.
    if (event.livemode && environment.HUBSPOT_INTAKE_ENABLED !== "true") {
      throw new Error("No live payment CRM is configured.");
    }
    return { forwarded: false, ignored: false, reason: "legacy-crm-not-configured" };
  }
  let endpointUrl;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new Error("CRM payment delivery configuration is invalid.");
  }
  if (endpointUrl.protocol !== "https:" || secret.length < 32) {
    throw new Error("CRM payment delivery configuration is invalid.");
  }

  if (!CRM_PAYMENT_HANDOFF_EVENTS.has(event.type)) return { forwarded: false, ignored: true };

  const body = JSON.stringify(crmPaymentHandoff(event, {
    allowLive: livePaymentProcessingAllowed(environment)
  }));
  const timestamp = clockSeconds();
  const response = await fetchImplementation(endpointUrl.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rainbow-event-id": event.id,
      "x-rainbow-payment-signature": `t=${timestamp},v1=${signPayload(`${timestamp}.${body}`, secret)}`
    },
    body
  });
  if (!response.ok) throw new Error(`CRM payment delivery failed with status ${response.status}.`);
  return { forwarded: true, ignored: false };
}

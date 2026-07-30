import { createHmac, timingSafeEqual } from "node:crypto";

export const SUPPORTED_STRIPE_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "charge.refunded"
]);

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

export async function forwardStripeEvent(event, environment, fetchImplementation = fetch) {
  if (!SUPPORTED_STRIPE_EVENTS.has(event.type)) return { forwarded: false, ignored: true };

  const endpoint = environment.CRM_STRIPE_EVENT_URL;
  const secret = environment.CRM_STRIPE_EVENT_SECRET;
  if (!endpoint || !secret) {
    if (event.livemode) throw new Error("Live CRM payment delivery is not configured.");
    return { forwarded: false, ignored: false };
  }

  const body = JSON.stringify(safeStripeEvent(event));
  const response = await fetchImplementation(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rainbow-event-id": event.id,
      "x-rainbow-signature": signPayload(body, secret)
    },
    body
  });
  if (!response.ok) throw new Error(`CRM payment delivery failed with status ${response.status}.`);
  return { forwarded: true, ignored: false };
}

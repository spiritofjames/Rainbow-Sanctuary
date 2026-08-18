import Stripe from "stripe";
import { assertAllowedOrigin, assertCheckoutConfiguration } from "../_lib/checkout-policy.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";
import {
  completedStripeEventFromCheckoutSession,
  sendPurchaseConfirmation
} from "../_lib/group-healing-booking-email.mjs";
import { isInternalPaymentTest } from "../_lib/webhook-delivery.mjs";
import { isOptionalContributionSession } from "../_lib/optional-contribution.mjs";

const CHECKOUT_SESSION_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]+$/;

// A verified Stripe Checkout Session is safe to reconcile because the
// recipient, offer and amount all come from Stripe—not from the browser.
// This is deliberately email-only: the signed webhook remains the authority
// for CRM and calendar roster updates, while this path prevents a paid person
// from being left without access details during a transient webhook outage.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  let sessionId;
  try {
    assertCheckoutConfiguration(process.env);
    assertAllowedOrigin(request, process.env);
    sessionId = String(parseJsonBody(request)?.session_id || "");
    if (!CHECKOUT_SESSION_PATTERN.test(sessionId)) {
      return sendJson(response, 400, { error: "The payment confirmation could not be reconciled." });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return sendJson(response, 409, { error: "The payment is not complete yet." });
    }
    if (isInternalPaymentTest({ data: { object: session } }) || isOptionalContributionSession(session, process.env)) {
      return sendJson(response, 200, { fulfilled: false, reason: "not-a-booking" });
    }

    const delivery = await sendPurchaseConfirmation(
      completedStripeEventFromCheckoutSession(session),
      process.env
    );
    console.info("stripe_checkout_confirmation_reconciled", {
      checkoutSessionId: session.id,
      offer: session.metadata?.offer_key || null,
      emailSent: delivery.sent === true
    });
    return sendJson(response, 200, { fulfilled: delivery.sent === true });
  } catch (error) {
    console.error("stripe_checkout_confirmation_reconcile_error", {
      checkoutSessionId: sessionId || null,
      message: error.message
    });
    return sendJson(response, 502, { error: "Your confirmation email could not be prepared yet." });
  }
}

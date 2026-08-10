import Stripe from "stripe";
import { assertCheckoutConfiguration } from "../_lib/checkout-policy.mjs";
import { sendJson } from "../_lib/http.mjs";

const CHECKOUT_SESSION_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]+$/;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const sessionId = String(request.query?.session_id || "");
  if (!CHECKOUT_SESSION_PATTERN.test(sessionId)) {
    return sendJson(response, 400, { error: "The payment confirmation could not be verified." });
  }

  try {
    assertCheckoutConfiguration(process.env);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const offer = String(session.metadata?.offer_key || "");
    const amount = Number.isSafeInteger(session.amount_total) ? session.amount_total : null;
    const currency = /^[a-z]{3}$/i.test(String(session.currency || ""))
      ? String(session.currency).toUpperCase()
      : "";

    response.setHeader("Cache-Control", "no-store, max-age=0");
    return sendJson(response, 200, {
      state: paid ? "paid" : "pending",
      offer,
      amount,
      currency,
      internalTest: session.metadata?.internal_payment_test === "true"
    });
  } catch (error) {
    console.error("checkout_status_error", { message: error.message });
    return sendJson(response, 502, { error: "The payment confirmation could not be verified." });
  }
}

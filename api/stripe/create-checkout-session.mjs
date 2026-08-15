import Stripe from "stripe";
import {
  assertAllowedOrigin,
  assertCheckoutConfiguration,
  checkoutSessionParameters,
  validateCheckoutRequest
} from "../_lib/checkout-policy.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    assertCheckoutConfiguration(process.env);
    const origin = assertAllowedOrigin(request, process.env);
    const { eventId, offer, offerId, requestId } = validateCheckoutRequest(
      parseJsonBody(request),
      process.env
    );
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(
      checkoutSessionParameters({
        eventId,
        offer,
        origin,
        environment: process.env,
        taxEnabled: process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true" &&
          process.env.STRIPE_TAX_DISPLAY_APPROVED === "true"
      }),
      { idempotencyKey: `rainbow:${offerId}:${eventId}:${requestId}` }
    );

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return sendJson(response, 200, { url: session.url });
  } catch (error) {
    const expected = /not enabled|not configured|approved|not permitted|not open|not allowed|Invalid|required/.test(error.message);
    console.error("checkout_session_error", { message: error.message });
    return sendJson(response, expected ? 400 : 502, {
      error: expected ? error.message : "Secure checkout is temporarily unavailable."
    });
  }
}

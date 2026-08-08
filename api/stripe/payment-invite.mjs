import Stripe from "stripe";
import {
  assertAllowedPaymentInviteOrigin,
  assertCheckoutConfiguration,
  checkoutSessionParameters
} from "../_lib/checkout-policy.mjs";
import { sendJson } from "../_lib/http.mjs";
import { resolveOfferVariant } from "../_lib/offer-catalog.mjs";
import {
  allowedStaffOfferIds,
  paymentInviteSignatureMatches
} from "../_lib/payment-invite.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    assertCheckoutConfiguration(process.env);
    const origin = assertAllowedPaymentInviteOrigin(request, process.env);
    const offerId = String(request.query?.offer || "");
    const version = String(request.query?.v || "");
    const signature = String(request.query?.sig || "");
    const offer = resolveOfferVariant(offerId);

    if (
      offer.policy === "group-healing" ||
      version !== "v1" ||
      !allowedStaffOfferIds(process.env).has(offerId) ||
      !paymentInviteSignatureMatches(
        offerId,
        process.env.PAYMENT_INVITE_SIGNING_SECRET,
        signature,
        version
      )
    ) {
      throw new Error("This payment invitation is not active.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(checkoutSessionParameters({
      eventId: offer.sessionId,
      offer,
      origin,
      taxEnabled: process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true" &&
        process.env.STRIPE_TAX_DISPLAY_APPROVED === "true"
    }));
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    response.setHeader("Cache-Control", "no-store");
    return response.redirect(303, session.url);
  } catch (error) {
    console.error("stripe_payment_invite_error", { message: error.message });
    return sendJson(response, 400, { error: "This payment invitation is unavailable." });
  }
}

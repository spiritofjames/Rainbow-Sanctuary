import Stripe from "stripe";
import { readRawBody, sendJson } from "../_lib/http.mjs";
import { forwardStripeEvent } from "../_lib/webhook-delivery.mjs";
import { sendPurchaseConfirmation } from "../_lib/group-healing-booking-email.mjs";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return sendJson(response, 503, { error: "Webhook is not configured." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const rawBody = await readRawBody(request);
    const signature = request.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    const delivery = await forwardStripeEvent(event, process.env);
    let bookingEmail = { sent: false, reason: "not-applicable" };
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      try {
        bookingEmail = await sendPurchaseConfirmation(event, process.env);
      } catch (emailError) {
        // Payment, CRM state and the Stripe receipt must never depend on email delivery.
        // Do not log the recipient or other customer information.
        console.error("stripe_booking_confirmation_error", {
          eventId: event.id,
          message: emailError.message
        });
        bookingEmail = { sent: false, reason: "failed" };
      }
    }
    console.info("stripe_event_received", {
      eventId: event.id,
      type: event.type,
      forwarded: delivery.forwarded,
      ignored: delivery.ignored,
      bookingEmailSent: bookingEmail.sent,
      bookingEmailReason: bookingEmail.reason || null
    });
    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("stripe_webhook_error", { message: error.message });
    return sendJson(response, 400, { error: "Webhook delivery failed." });
  }
}

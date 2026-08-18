import Stripe from "stripe";
import { readRawBody, sendJson } from "../_lib/http.mjs";
import { forwardStripeEvent, isInternalPaymentTest } from "../_lib/webhook-delivery.mjs";
import { sendPurchaseConfirmation } from "../_lib/group-healing-booking-email.mjs";
import { mirrorHubSpotPurchase } from "../_lib/hubspot-payment.mjs";
import { attemptPurchaseOperationsNotification } from "../_lib/operations-notification.mjs";
import { isOptionalContributionSession } from "../_lib/optional-contribution.mjs";
import { hydrateStaffPaymentLinkEvent } from "../_lib/staff-payment-links.mjs";
import { syncPaidGroupHealingParticipant } from "../_lib/group-healing-calendar.mjs";

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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    const rawBody = await readRawBody(request);
    event = stripe.webhooks.constructEvent(
      rawBody,
      request.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    // An invalid signature must be rejected without asking Stripe to retry it.
    console.error("stripe_webhook_signature_error", { message: error.message });
    return sendJson(response, 400, { error: "Webhook signature could not be verified." });
  }

  try {
    const governedEvent = hydrateStaffPaymentLinkEvent(event, process.env);
    let delivery = { forwarded: false, ignored: true, reason: "not-applicable" };
    let bookingEmail = { sent: false, reason: "not-applicable" };
    let calendarInvitation = { enabled: false, reason: "not-applicable" };
    if (
      ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) &&
      !isInternalPaymentTest(governedEvent) &&
      !isOptionalContributionSession(governedEvent?.data?.object, process.env)
    ) {
      // The participant confirmation is the first operational action after a
      // verified Stripe payment. It is independently idempotent, so a later
      // temporary CRM error cannot strand a paid person without their access
      // details while Stripe retries the event.
      try {
        bookingEmail = await sendPurchaseConfirmation(governedEvent, process.env);
      } catch (emailError) {
        // Payment, CRM state and the Stripe receipt must never depend on email delivery.
        // Do not log the recipient or other customer information.
        console.error("stripe_booking_confirmation_error", {
          eventId: event.id,
          message: emailError.message
        });
        bookingEmail = { sent: false, reason: "failed" };
      }
      const hubspot = await mirrorHubSpotPurchase(governedEvent, process.env);
      await attemptPurchaseOperationsNotification(governedEvent, hubspot, process.env);
      try {
        calendarInvitation = await syncPaidGroupHealingParticipant(governedEvent, process.env);
      } catch (calendarError) {
        // The verified payment and HubSpot record are authoritative. A staff
        // calendar outage must be visible for follow-up but must not block a
        // paid participant's confirmation or cause Stripe to retry a charge.
        console.error("stripe_group_healing_calendar_invitation_error", { eventId: event.id, message: calendarError.message });
        calendarInvitation = { enabled: false, reason: "failed" };
      }
    }
    try {
      // The legacy gateway is a secondary mirror. HubSpot has already received
      // the verified purchase above, so its temporary absence cannot strand a
      // paid participant or make Stripe repeatedly charge/retry a completed sale.
      delivery = await forwardStripeEvent(governedEvent, process.env);
    } catch (crmError) {
      console.error("stripe_legacy_crm_mirror_error", {
        eventId: event.id,
        message: crmError.message
      });
      delivery = { forwarded: false, ignored: false, reason: "legacy-crm-failed" };
    }
    console.info("stripe_event_received", {
      eventId: event.id,
      type: event.type,
      forwarded: delivery.forwarded,
      ignored: delivery.ignored,
      deliveryReason: delivery.reason || null,
      bookingEmailSent: bookingEmail.sent,
      bookingEmailReason: bookingEmail.reason || null,
      calendarInvitationEnabled: calendarInvitation.enabled,
      calendarInvitationReason: calendarInvitation.reason || null
    });
    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("stripe_webhook_error", { message: error.message });
    // Signature failures are rejected by Stripe before this point. A verified
    // event that cannot reach HubSpot must return a retryable error instead.
    return sendJson(response, 500, { error: "Webhook processing failed." });
  }
}

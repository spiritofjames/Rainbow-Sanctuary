import Stripe from "stripe";
import { readRawBody, sendJson } from "../_lib/http.mjs";
import { forwardStripeEvent, isInternalPaymentTest } from "../_lib/webhook-delivery.mjs";
import { sendPurchaseConfirmation } from "../_lib/group-healing-booking-email.mjs";
import { mirrorHubSpotPurchase } from "../_lib/hubspot-payment.mjs";
import { attemptPurchaseOperationsNotification } from "../_lib/operations-notification.mjs";
import { syncGroupHealingRegistrationToOperationsCalendar } from "../_lib/google-calendar-operations.mjs";
import { isOptionalContributionSession } from "../_lib/optional-contribution.mjs";
import { hydrateStaffPaymentLinkEvent } from "../_lib/staff-payment-links.mjs";

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
    let operationsCalendar = { synced: false, reason: "not-applicable" };
    if (
      ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) &&
      !isInternalPaymentTest(governedEvent) &&
      !isOptionalContributionSession(governedEvent?.data?.object, process.env)
    ) {
      const hubspot = await mirrorHubSpotPurchase(governedEvent, process.env);
      await attemptPurchaseOperationsNotification(governedEvent, hubspot, process.env);
      try {
        // This internal event deliberately contains an Operations-only booking
        // ledger. Clients are never Calendar attendees, preventing guest-list
        // disclosure and avoiding unintended Google invitations.
        operationsCalendar = await syncGroupHealingRegistrationToOperationsCalendar(
          governedEvent,
          hubspot,
          process.env
        );
      } catch (calendarError) {
        // The payment is already recorded in HubSpot. Calendar visibility is an
        // operational convenience and must never make Stripe retry a paid sale.
        console.error("stripe_operations_calendar_sync_error", {
          eventId: event.id,
          message: calendarError.message
        });
        operationsCalendar = { synced: false, reason: "failed" };
      }
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
      operationsCalendarSynced: operationsCalendar.synced,
      operationsCalendarReason: operationsCalendar.reason || null
    });
    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("stripe_webhook_error", { message: error.message });
    // Signature failures are rejected by Stripe before this point. A verified
    // event that cannot reach HubSpot must return a retryable error instead.
    return sendJson(response, 500, { error: "Webhook processing failed." });
  }
}

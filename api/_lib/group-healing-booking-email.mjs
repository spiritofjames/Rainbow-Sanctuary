import { crmPaymentHandoff } from "./webhook-delivery.mjs";
import { sendTransactionalEmail } from "./email-service.mjs";

const APPROVED_GROUP_HEALING_EVENTS = new Map([
  ["group-healing-2026-08-22", {
    title: "Grounding & Renewal",
    start: "2026-08-22T20:00:00+08:00",
    end: "2026-08-22T21:00:00+08:00",
    date: "Saturday, 22 August 2026",
    time: "8:00 PM",
    timezone: "Asia/Makassar (UTC+8)",
    location: "Online via Zoom — access details follow separately"
  }]
]);

function googleCalendarUrl(event) {
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: `Rainbow Sanctuary — ${event.title}`,
    dates: "20260822T120000Z/20260822T130000Z",
    details: "Your Rainbow Sanctuary Group Healing booking is confirmed. Zoom access details are sent separately through the participant communication process.",
    location: "Online"
  });
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

export function bookingConfirmationFromStripeEvent(stripeEvent) {
  const handoff = crmPaymentHandoff(stripeEvent);
  const event = APPROVED_GROUP_HEALING_EVENTS.get(handoff.sessionId);
  if (!event) throw new Error("No approved booking email catalog entry exists for this event.");

  return {
    alias: "rs-booking-confirmed",
    to: handoff.customer.email,
    variables: {
      NAME: handoff.customer.displayName,
      EVENT_TITLE: event.title,
      EVENT_DATE: event.date,
      EVENT_TIME: event.time,
      TIMEZONE: event.timezone,
      LOCATION: event.location,
      CALENDAR_URL: googleCalendarUrl(event),
      REFERENCE_ID: handoff.bookingReference
    },
    idempotencyKey: `stripe:${handoff.stripeEventId}:booking-confirmed`,
    tags: [
      { name: "offer", value: handoff.offerId },
      { name: "event", value: handoff.sessionId }
    ]
  };
}

export async function sendBookingConfirmation(stripeEvent, environment, resendClient) {
  const message = bookingConfirmationFromStripeEvent(stripeEvent);
  return sendTransactionalEmail(message, environment, resendClient);
}

import { checkoutAmountMatchesApprovedPrice, crmPaymentHandoff, isInternalPaymentTest, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { sendTransactionalEmail } from "./email-service.mjs";
import { resolveOfferVariant } from "./offer-catalog.mjs";
import { regenerationMaintenanceDatesForSession } from "./regeneration-maintenance-cycle.mjs";
import { groupHealingScheduleDetails } from "./group-healing-schedule.mjs";
import { groupHealingZoomJoinUrl } from "./group-healing-zoom.mjs";

const APPROVED_REGENERATION_MAINTENANCE_EVENTS = new Map([
  ["regeneration-maintenance-2026-08-17-monthly", {
    date: "Monday, 17 August 2026",
    time: "11:00 PM",
    timezone: "Beijing time (UTC+8)",
    commitment: "One-month commitment"
  }],
  ["regeneration-maintenance-2026-08-17-three-month", {
    date: "Monday, 17 August 2026",
    time: "11:00 PM",
    timezone: "Beijing time (UTC+8)",
    commitment: "First three-month cycle"
  }]
]);

function googleCalendarUrl(event, accessUrl) {
  const calendarDate = (value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: `Rainbow Sanctuary — ${event.title}`,
    dates: `${calendarDate(event.start)}/${calendarDate(event.end)}`,
    details: `Your Rainbow Sanctuary Group Healing booking is confirmed. Join securely with this Zoom link: ${accessUrl}`,
    location: "Online"
  });
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

function maintenanceDateList(sessionId) {
  return regenerationMaintenanceDatesForSession(sessionId).map((date) => new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Shanghai"
  }).format(new Date(`${date}T23:00:00+08:00`))).join("; ");
}

export function bookingConfirmationFromStripeEvent(stripeEvent, { allowLive = false, environment = process.env } = {}) {
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive });
  const offer = resolveOfferVariant("group-healing");
  const event = groupHealingScheduleDetails(handoff.sessionId);
  if (!event) throw new Error("No approved booking email catalog entry exists for this event.");
  if (handoff.offerId !== offer.id || !checkoutAmountMatchesApprovedPrice(handoff, offer.amountMinor)) {
    throw new Error("The Group Healing payment does not match the approved catalogue.");
  }
  const accessUrl = groupHealingZoomJoinUrl(environment);

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
      ACCESS_URL: accessUrl,
      CALENDAR_URL: googleCalendarUrl(event, accessUrl),
      REFERENCE_ID: handoff.bookingReference
    },
    idempotencyKey: `stripe:${handoff.stripeEventId}:booking-confirmed`,
    tags: [
      { name: "offer", value: handoff.offerId },
      { name: "event", value: handoff.sessionId }
    ]
  };
}

export function programConfirmationFromStripeEvent(stripeEvent, { allowLive = false } = {}) {
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive });
  const offer = resolveOfferVariant(handoff.offerId);
  if (
    offer.policy === "group-healing" ||
    handoff.sessionId !== offer.sessionId ||
    !checkoutAmountMatchesApprovedPrice(handoff, offer.amountMinor)
  ) {
    throw new Error("No approved programme email catalog entry exists for this purchase.");
  }

  return {
    alias: "rs-program-enrollment-confirmed",
    to: handoff.customer.email,
    variables: {
      NAME: handoff.customer.displayName,
      PROGRAM_NAME: offer.name,
      START_DATE: "Schedule confirmed separately",
      FORMAT: "As confirmed with the Rainbow Sanctuary team",
      TIMEZONE: "Included with your programme schedule",
      PROGRAM_URL: `https://rainbowsanctuary.life${offer.offer.pagePath}`
    },
    idempotencyKey: `stripe:${handoff.stripeEventId}:program-enrollment-confirmed`,
    tags: [
      { name: "offer", value: handoff.offerId },
      { name: "session", value: handoff.sessionId }
    ]
  };
}

export function regenerationMaintenanceConfirmationFromStripeEvent(stripeEvent, { allowLive = false } = {}) {
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive });
  const offer = resolveOfferVariant(handoff.offerId);
  const event = APPROVED_REGENERATION_MAINTENANCE_EVENTS.get(handoff.sessionId);
  if (!event) throw new Error("No approved Regeneration Maintenance email catalog entry exists for this event.");
  if (handoff.offerId !== offer.id || !checkoutAmountMatchesApprovedPrice(handoff, offer.amountMinor)) {
    throw new Error("The Regeneration Maintenance payment does not match the approved catalogue.");
  }
  return {
    alias: "rs-regeneration-maintenance-confirmed",
    to: handoff.customer.email,
    variables: {
      NAME: handoff.customer.displayName,
      PROGRAM_NAME: offer.name,
      EVENT_DATE: event.date,
      EVENT_TIME: event.time,
      TIMEZONE: event.timezone,
      REFERENCE_ID: handoff.bookingReference,
      COMMITMENT: event.commitment,
      SESSION_DATES: maintenanceDateList(handoff.sessionId)
    },
    idempotencyKey: `stripe:${handoff.stripeEventId}:regeneration-maintenance-confirmed`,
    tags: [
      { name: "offer", value: handoff.offerId },
      { name: "event", value: handoff.sessionId }
    ]
  };
}

export function purchaseConfirmationFromStripeEvent(stripeEvent, { allowLive = false, environment = process.env } = {}) {
  if (isInternalPaymentTest(stripeEvent)) {
    throw new Error("Internal payment tests do not create participant confirmation emails.");
  }
  const offerKey = String(stripeEvent.data?.object?.metadata?.offer_key || "");
  if (offerKey === "group-healing") return bookingConfirmationFromStripeEvent(stripeEvent, { allowLive, environment });
  if (offerKey.startsWith("regeneration-maintenance-")) return regenerationMaintenanceConfirmationFromStripeEvent(stripeEvent, { allowLive });
  return programConfirmationFromStripeEvent(stripeEvent, { allowLive });
}

export async function sendBookingConfirmation(stripeEvent, environment, resendClient) {
  const message = bookingConfirmationFromStripeEvent(stripeEvent, {
    allowLive: livePaymentProcessingAllowed(environment),
    environment
  });
  return sendTransactionalEmail(message, environment, resendClient);
}

export async function sendPurchaseConfirmation(stripeEvent, environment, resendClient) {
  const message = purchaseConfirmationFromStripeEvent(stripeEvent, {
    allowLive: livePaymentProcessingAllowed(environment),
    environment
  });
  return sendTransactionalEmail(message, environment, resendClient);
}

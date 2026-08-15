import { sendTransactionalEmail } from "./email-service.mjs";
import { hydrateStaffPaymentLinkEvent } from "./staff-payment-links.mjs";
import { regenerationMaintenanceDatesForSession } from "./regeneration-maintenance-cycle.mjs";

const BEIJING_TIME_ZONE = "Asia/Shanghai";
const MAX_STRIPE_PAGES = 20;

function beijingDate(now) {
  const fields = new Intl.DateTimeFormat("en-CA", {
    timeZone: BEIJING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const value = Object.fromEntries(fields.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}

function displayDate(date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: BEIJING_TIME_ZONE
  }).format(new Date(`${date}T23:00:00+08:00`));
}

function participantDetails(session) {
  const email = String(session.customer_details?.email || session.customer_email || "").trim();
  const customName = (session.custom_fields || []).find((field) => field.key === "client_display_name")?.text?.value;
  const name = String(customName || session.customer_details?.name || "there").trim() || "there";
  return { email, name };
}

function checkoutEventFromSession(session) {
  return {
    id: `evt_maintenance_reminder_${session.id}`,
    type: "checkout.session.completed",
    created: Number(session.created || 0),
    livemode: Boolean(session.livemode),
    data: { object: session }
  };
}

export function regenerationMaintenanceEventIdForDate(now = new Date()) {
  return `regeneration-maintenance-${beijingDate(now)}`;
}

export function cronRequestIsAuthorized(request, environment = process.env) {
  const secret = String(environment.CRON_SECRET || "");
  return secret.length >= 32 && request.headers?.authorization === `Bearer ${secret}`;
}

/** Sends one idempotent reminder to every paid participant whose purchased commitment covers today's Beijing date. */
export async function sendRegenerationMaintenanceDayOfReminders({ stripe, environment = process.env, now = new Date(), resendClient }) {
  const date = beijingDate(now);
  const eventId = regenerationMaintenanceEventIdForDate(now);
  const counters = { eventId, inspected: 0, matched: 0, sent: 0, skipped: 0 };
  let startingAfter;

  for (let page = 0; page < MAX_STRIPE_PAGES; page += 1) {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    for (const session of sessions.data || []) {
      counters.inspected += 1;
      const object = hydrateStaffPaymentLinkEvent(checkoutEventFromSession(session), environment).data.object;
      const offerKey = String(object.metadata?.offer_key || "");
      const coveredDates = regenerationMaintenanceDatesForSession(String(object.metadata?.event_id || ""));
      if (object.payment_status !== "paid" || !object.livemode || !offerKey.startsWith("regeneration-maintenance-") || !coveredDates.includes(date)) continue;

      const participant = participantDetails(object);
      if (!participant.email) {
        counters.skipped += 1;
        continue;
      }
      counters.matched += 1;
      try {
        const delivery = await sendTransactionalEmail({
          alias: "rs-regeneration-maintenance-day-of-reminder",
          to: participant.email,
          variables: { NAME: participant.name, EVENT_DATE: displayDate(date), EVENT_TIME: "11:00 PM", TIMEZONE: "Beijing time (UTC+8)" },
          idempotencyKey: `maintenance-day-of:${eventId}:${object.id}`,
          tags: [{ name: "offer", value: offerKey }, { name: "event", value: eventId }, { name: "timing", value: "day_of" }]
        }, environment, resendClient);
        if (delivery.sent) counters.sent += 1;
        else counters.skipped += 1;
      } catch (error) {
        console.error("regeneration_maintenance_reminder_delivery_error", { eventId, message: error.message });
        counters.skipped += 1;
      }
    }
    if (!sessions.has_more) return counters;
    startingAfter = sessions.data?.at(-1)?.id;
    if (!startingAfter) break;
  }
  throw new Error("Stripe Checkout session pagination exceeded the approved reminder limit.");
}

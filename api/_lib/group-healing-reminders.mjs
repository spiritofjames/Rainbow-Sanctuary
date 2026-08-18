import { sendTransactionalEmail } from "./email-service.mjs";
import { groupHealingScheduleDetails, groupHealingSessionForDate } from "./group-healing-schedule.mjs";
import { groupHealingZoomJoinUrl } from "./group-healing-zoom.mjs";
import { hydrateStaffPaymentLinkEvent } from "./staff-payment-links.mjs";

const MAX_STRIPE_PAGES = 20;

function participantDetails(session) {
  const email = String(session.customer_details?.email || session.customer_email || "").trim();
  const customName = (session.custom_fields || []).find((field) => field.key === "client_display_name")?.text?.value;
  return { email, name: String(customName || session.customer_details?.name || "there").trim() || "there" };
}

function checkoutEventFromSession(session) {
  return { id: `evt_group_healing_reminder_${session.id}`, type: "checkout.session.completed", created: Number(session.created || 0), livemode: Boolean(session.livemode), data: { object: session } };
}

export function groupHealingReminderRequestIsAuthorized(request, environment = process.env) {
  const secret = String(environment.CRON_SECRET || "");
  return secret.length >= 32 && request.headers?.authorization === `Bearer ${secret}`;
}

/** Sends exactly one idempotent, one-hour-before reminder to each paid participant of today's session. */
export async function sendGroupHealingOneHourReminders({ stripe, environment = process.env, now = new Date(), resendClient }) {
  const event = groupHealingSessionForDate(now);
  if (!event) return { eventId: null, inspected: 0, matched: 0, sent: 0, skipped: 0 };
  const zoomUrl = groupHealingZoomJoinUrl(environment);
  const counters = { eventId: event.id, inspected: 0, matched: 0, sent: 0, skipped: 0 };
  let startingAfter;
  for (let page = 0; page < MAX_STRIPE_PAGES; page += 1) {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    for (const session of sessions.data || []) {
      counters.inspected += 1;
      const object = hydrateStaffPaymentLinkEvent(checkoutEventFromSession(session), environment).data.object;
      if (object.payment_status !== "paid" || !object.livemode || String(object.metadata?.offer_key || "") !== "group-healing" || String(object.metadata?.event_id || "") !== event.id) continue;
      const participant = participantDetails(object);
      if (!participant.email) { counters.skipped += 1; continue; }
      counters.matched += 1;
      try {
        const delivered = await sendTransactionalEmail({
          alias: "rs-booking-reminder-1h",
          to: participant.email,
          variables: { NAME: participant.name, EVENT_TITLE: event.title, EVENT_TIME: event.time, TIMEZONE: event.timezone, ACCESS_URL: zoomUrl },
          idempotencyKey: `group-healing-1h:${event.id}:${object.id}`,
          tags: [{ name: "offer", value: "group-healing" }, { name: "event", value: event.id }, { name: "timing", value: "one_hour" }]
        }, environment, resendClient);
        if (delivered.sent) counters.sent += 1;
        else counters.skipped += 1;
      } catch (error) {
        console.error("group_healing_reminder_delivery_error", { eventId: event.id, message: error.message });
        counters.skipped += 1;
      }
    }
    if (!sessions.has_more) return counters;
    startingAfter = sessions.data?.at(-1)?.id;
    if (!startingAfter) break;
  }
  throw new Error("Stripe Checkout session pagination exceeded the approved reminder limit.");
}

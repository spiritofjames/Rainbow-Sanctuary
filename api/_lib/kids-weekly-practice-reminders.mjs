import { sendTransactionalEmail } from "./email-service.mjs";
import { hydrateStaffPaymentLinkEvent } from "./staff-payment-links.mjs";
import { kidsWeeklyPracticeDatesForSession, KIDS_WEEKLY_PRACTICE_TIME_ZONE } from "./kids-weekly-practice-schedule.mjs";

const MAX_STRIPE_PAGES = 20;

function localDate(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: KIDS_WEEKLY_PRACTICE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}

function displayDate(date) {
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: KIDS_WEEKLY_PRACTICE_TIME_ZONE }).format(new Date(`${date}T20:00:00+08:00`));
}

function checkoutEvent(session) {
  return { id: `evt_kids_reminder_${session.id}`, type: "checkout.session.completed", created: Number(session.created || 0), livemode: Boolean(session.livemode), data: { object: session } };
}

function field(session, key) {
  return String((session.custom_fields || []).find((item) => item.key === key)?.text?.value || "").trim();
}

/** Sends one 1-hour-before reminder per paid guardian whose commitment covers today's Saturday. */
export async function sendKidsWeeklyPracticeOneHourReminders({ stripe, environment = process.env, now = new Date(), resendClient }) {
  const date = localDate(now);
  const eventId = `kids-weekly-practice-${date}`;
  const counters = { eventId, inspected: 0, matched: 0, sent: 0, skipped: 0 };
  let startingAfter;
  for (let page = 0; page < MAX_STRIPE_PAGES; page += 1) {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) });
    for (const raw of sessions.data || []) {
      counters.inspected += 1;
      const session = hydrateStaffPaymentLinkEvent(checkoutEvent(raw), environment).data.object;
      const offerKey = String(session.metadata?.offer_key || "");
      const dates = kidsWeeklyPracticeDatesForSession(String(session.metadata?.event_id || ""));
      if (session.payment_status !== "paid" || !session.livemode || !offerKey.startsWith("kids-weekly-practice-") || !dates.includes(date)) continue;
      const email = String(session.customer_details?.email || session.customer_email || "").trim();
      const accessUrl = String(environment.KIDS_WEEKLY_PRACTICE_ZOOM_JOIN_URL || "").trim();
      if (!email || !accessUrl) { counters.skipped += 1; continue; }
      counters.matched += 1;
      try {
        const result = await sendTransactionalEmail({
          alias: "rs-kids-weekly-practice-reminder-1h", to: email,
          variables: {
            NAME: String(session.customer_details?.name || "there").trim() || "there",
            CHILD_NAME: field(session, "child_name") || "your child",
            EVENT_DATE: displayDate(date), EVENT_TIME: "8:00 PM", TIMEZONE: "Singapore / Kuala Lumpur / China time (UTC+8)", ACCESS_URL: accessUrl
          },
          idempotencyKey: `kids-weekly-practice-1h:${eventId}:${session.id}`,
          tags: [{ name: "offer", value: offerKey }, { name: "event", value: eventId }, { name: "timing", value: "one_hour" }]
        }, environment, resendClient);
        if (result.sent) counters.sent += 1; else counters.skipped += 1;
      } catch (error) { console.error("kids_weekly_practice_reminder_delivery_error", { eventId, message: error.message }); counters.skipped += 1; }
    }
    if (!sessions.has_more) return counters;
    startingAfter = sessions.data?.at(-1)?.id;
    if (!startingAfter) break;
  }
  throw new Error("Stripe Checkout session pagination exceeded the approved Children’s Weekly Practice reminder limit.");
}

import test from "node:test";
import assert from "node:assert/strict";
import { groupHealingReminderRequestIsAuthorized, sendGroupHealingOneHourReminders } from "../api/_lib/group-healing-reminders.mjs";

function session(overrides = {}) {
  return {
    id: "cs_live_group_healing_123", created: 1, livemode: true, payment_status: "paid", amount_total: 2200, currency: "usd",
    customer_details: { email: "participant@example.com", name: "Participant" },
    custom_fields: [{ key: "client_display_name", text: { value: "Participant Name" } }],
    metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-18" },
    ...overrides
  };
}

test("sends a one-hour Zoom reminder only to paid people booked for today's Group Healing session", async () => {
  const sent = [];
  const result = await sendGroupHealingOneHourReminders({
    stripe: { checkout: { sessions: { list: async () => ({ has_more: false, data: [session(), session({ id: "cs_other_session", metadata: { offer_key: "group-healing", event_id: "group-healing-weekly-2026-08-25" } }), session({ id: "cs_unpaid", payment_status: "unpaid" })] }) } } },
    now: new Date("2026-08-18T12:00:00.000Z"),
    environment: { RESEND_EMAIL_ENABLED: "true", RESEND_API_KEY: "test", VERCEL_ENV: "preview", RESEND_ALLOWED_RECIPIENTS: "participant@example.com", GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure" },
    resendClient: { emails: { send: async (payload, options) => { sent.push([payload, options]); return { data: { id: "email_123" }, error: null }; } } }
  });
  assert.deepEqual(result, { eventId: "group-healing-2026-08-18", inspected: 3, matched: 1, sent: 1, skipped: 0 });
  assert.equal(sent[0][0].subject, "Starting soon: your Rainbow Sanctuary session");
  assert.equal(sent[0][1].idempotencyKey, "group-healing-1h:group-healing-2026-08-18:cs_live_group_healing_123");
  assert.match(sent[0][0].html, /rainbowsanctuary\.zoom\.us/);
});

test("requires the cron secret for Group Healing reminder delivery", () => {
  const secret = "a".repeat(32);
  assert.equal(groupHealingReminderRequestIsAuthorized({ headers: { authorization: `Bearer ${secret}` } }, { CRON_SECRET: secret }), true);
  assert.equal(groupHealingReminderRequestIsAuthorized({ headers: {} }, { CRON_SECRET: secret }), false);
});

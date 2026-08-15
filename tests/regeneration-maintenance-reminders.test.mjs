import test from "node:test";
import assert from "node:assert/strict";
import { cronRequestIsAuthorized, regenerationMaintenanceEventIdForDate, sendRegenerationMaintenanceDayOfReminders } from "../api/_lib/regeneration-maintenance-reminders.mjs";

function session(overrides = {}) {
  return {
    id: "cs_live_maintenance_123", created: 1, livemode: true, payment_status: "paid", amount_total: 21000, currency: "usd",
    customer_details: { email: "participant@example.com", name: "Participant" },
    metadata: { offer_key: "regeneration-maintenance-monthly", event_id: "regeneration-maintenance-2026-08-17-monthly" },
    ...overrides
  };
}

test("maps the reminder clock to the Beijing Maintenance date", () => {
  assert.equal(regenerationMaintenanceEventIdForDate(new Date("2026-08-17T01:15:00.000Z")), "regeneration-maintenance-2026-08-17");
});

test("sends only to paid live participants whose commitment covers today's exact date", async () => {
  const sent = [];
  const result = await sendRegenerationMaintenanceDayOfReminders({
    stripe: { checkout: { sessions: { list: async () => ({ has_more: false, data: [session(), session({ id: "cs_not_covered", metadata: { offer_key: "regeneration-maintenance-monthly", event_id: "regeneration-maintenance-2026-09-14-monthly" } }), session({ id: "cs_unpaid", payment_status: "unpaid" }), session({ id: "cs_test", livemode: false })] }) } } },
    now: new Date("2026-08-17T01:15:00.000Z"),
    environment: { RESEND_EMAIL_ENABLED: "true", RESEND_API_KEY: "test", VERCEL_ENV: "preview", RESEND_ALLOWED_RECIPIENTS: "participant@example.com" },
    resendClient: { emails: { send: async (payload, options) => { sent.push([payload, options]); return { data: { id: "email_123" }, error: null }; } } }
  });
  assert.deepEqual(result, { eventId: "regeneration-maintenance-2026-08-17", inspected: 4, matched: 1, sent: 1, skipped: 0 });
  assert.equal(sent[0][0].template.id, "rs-regeneration-maintenance-day-of-reminder");
  assert.equal(sent[0][1].idempotencyKey, "maintenance-day-of:regeneration-maintenance-2026-08-17:cs_live_maintenance_123");
});

test("the twelve-week commitment does not receive a reminder after 2 November", async () => {
  const sent = [];
  const result = await sendRegenerationMaintenanceDayOfReminders({
    stripe: { checkout: { sessions: { list: async () => ({ has_more: false, data: [session({
      metadata: { offer_key: "regeneration-maintenance-three-month", event_id: "regeneration-maintenance-2026-08-17-three-month" }
    })] }) } } },
    now: new Date("2026-11-09T01:15:00.000Z"),
    environment: { RESEND_EMAIL_ENABLED: "true", RESEND_API_KEY: "test", VERCEL_ENV: "preview", RESEND_ALLOWED_RECIPIENTS: "participant@example.com" },
    resendClient: { emails: { send: async (payload) => { sent.push(payload); return { data: { id: "email_123" }, error: null }; } } }
  });
  assert.deepEqual(result, { eventId: "regeneration-maintenance-2026-11-09", inspected: 1, matched: 0, sent: 0, skipped: 0 });
  assert.equal(sent.length, 0);
});

test("requires the cron secret", () => {
  const secret = "a".repeat(32);
  assert.equal(cronRequestIsAuthorized({ headers: { authorization: `Bearer ${secret}` } }, { CRON_SECRET: secret }), true);
  assert.equal(cronRequestIsAuthorized({ headers: {} }, { CRON_SECRET: secret }), false);
});

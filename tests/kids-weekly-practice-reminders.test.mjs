import test from "node:test";
import assert from "node:assert/strict";
import { sendKidsWeeklyPracticeOneHourReminders } from "../api/_lib/kids-weekly-practice-reminders.mjs";

const environment = {
  VERCEL_ENV: "production",
  RESEND_EMAIL_ENABLED: "true",
  RESEND_PRODUCTION_APPROVED: "true",
  RESEND_API_KEY: "re_test",
  KIDS_WEEKLY_PRACTICE_ZOOM_JOIN_URL: "https://zoom.us/j/123456789",
  STRIPE_KIDS_WEEKLY_PRACTICE_FOUR_WEEK_PRICE_ID: "price_1U7UcLHrqlaOfUb78mDMP5Wm",
  STRIPE_KIDS_WEEKLY_PRACTICE_TWELVE_WEEK_PRICE_ID: "price_1U7UilHrqlaOfUb7fcNcrEnu"
};

test("Children’s Weekly Practice sends one paid guardian a one-hour reminder for an included Saturday", async () => {
  const outbound = [];
  const stripe = {
    checkout: {
      sessions: {
        list: async () => ({
          data: [{
            id: "cs_children_4_week",
            created: 1,
            livemode: true,
            payment_status: "paid",
            customer_details: { email: "guardian@example.test", name: "Alex Guardian" },
            custom_fields: [{ key: "child_name", text: { value: "Ari" } }],
            metadata: {
              offer_key: "kids-weekly-practice-four-week",
              event_id: "kids-weekly-practice-2026-08-29-four-week"
            }
          }],
          has_more: false
        })
      }
    }
  };
  const resendClient = {
    emails: {
      send: async (message, options) => {
        outbound.push({ message, options });
        return { data: { id: "email_children_reminder" }, error: null };
      }
    }
  };

  const result = await sendKidsWeeklyPracticeOneHourReminders({
    stripe,
    environment,
    now: new Date("2026-08-29T11:00:00Z"),
    resendClient
  });

  assert.deepEqual(result, {
    eventId: "kids-weekly-practice-2026-08-29",
    inspected: 1,
    matched: 1,
    sent: 1,
    skipped: 0
  });
  assert.equal(outbound.length, 1);
  assert.equal(outbound[0].message.to[0], "guardian@example.test");
  assert.match(outbound[0].message.subject, /Starting in one hour/);
  assert.match(outbound[0].message.html, /Ari/);
  assert.match(outbound[0].message.html, /zoom\.us\/j\/123456789/);
  assert.equal(outbound[0].options.idempotencyKey, "kids-weekly-practice-1h:kids-weekly-practice-2026-08-29:cs_children_4_week");
});

test("Children’s Weekly Practice does not remind a four-week guardian after their included dates end", async () => {
  const stripe = {
    checkout: {
      sessions: {
        list: async () => ({
          data: [{
            id: "cs_children_expired",
            created: 1,
            livemode: true,
            payment_status: "paid",
            customer_details: { email: "guardian@example.test", name: "Alex Guardian" },
            metadata: {
              offer_key: "kids-weekly-practice-four-week",
              event_id: "kids-weekly-practice-2026-08-29-four-week"
            }
          }],
          has_more: false
        })
      }
    }
  };
  const result = await sendKidsWeeklyPracticeOneHourReminders({
    stripe,
    environment,
    now: new Date("2026-09-26T11:00:00Z"),
    resendClient: { emails: { send: async () => { throw new Error("No email should be sent."); } } }
  });

  assert.deepEqual(result, {
    eventId: "kids-weekly-practice-2026-09-26",
    inspected: 1,
    matched: 0,
    sent: 0,
    skipped: 0
  });
});

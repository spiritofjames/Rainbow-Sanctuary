import test from "node:test";
import assert from "node:assert/strict";
import { ensureGroupHealingStaffCalendarEvents, syncPaidGroupHealingParticipant } from "../api/_lib/group-healing-calendar.mjs";

const environment = {
  VERCEL_ENV: "production",
  STRIPE_LIVE_CHECKOUT_APPROVED: "true",
  STRIPE_SECRET_KEY: "sk_live_test",
  STRIPE_WEBHOOK_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED: "true",
  GOOGLE_CALENDAR_CLIENT_ID: "client-id",
  GOOGLE_CALENDAR_CLIENT_SECRET: "client-secret",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh-token",
  GROUP_HEALING_ZOOM_JOIN_URL: "https://rainbowsanctuary.zoom.us/j/123456789?pwd=secure"
};

function response(body = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test("provisions a private recurring staff event on Operations and PSN calendars", async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (options.method === "GET") return response({}, 404);
    return response({ id: "event" });
  };
  const result = await ensureGroupHealingStaffCalendarEvents(environment, fetchMock);
  assert.equal(result.enabled, true);
  const calendarWrites = requests.filter(([url, options]) => url.includes("googleapis.com/calendar") && options.method === "POST");
  assert.equal(calendarWrites.length, 2);
  const body = JSON.parse(calendarWrites[0][1].body);
  assert.equal(body.visibility, "private");
  assert.match(body.description, /zoom\.us/);
  assert.deepEqual(body.recurrence, ["RRULE:FREQ=WEEKLY;COUNT=53;BYDAY=TU"]);
});

test("creates private roster entries without making customers Google Calendar attendees", async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (options.method === "GET") return response({}, 404);
    return response({ id: "event" });
  };
  const stripeEvent = { id: "evt_group_roster_123", type: "checkout.session.completed", created: 1787043600, livemode: true, data: { object: { id: "cs_group_roster_123", payment_intent: "pi_group_roster_123", payment_status: "paid", amount_total: 2200, amount_subtotal: 2200, currency: "usd", customer_details: { email: "person@example.com", name: "Person Name" }, custom_fields: [{ key: "client_display_name", text: { value: "Person Name" } }], metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-18" } } } };
  const result = await syncPaidGroupHealingParticipant(stripeEvent, environment, fetchMock);
  assert.deepEqual(result, { enabled: true, sessionId: "group-healing-2026-08-18", staffCalendars: 2 });
  const body = JSON.parse(requests.find(([url, options]) => url.includes("googleapis.com/calendar") && options.method === "POST")[1].body);
  assert.equal(body.visibility, "private");
  assert.equal(body.attendees, undefined);
  assert.match(body.description, /person@example\.com/);
});

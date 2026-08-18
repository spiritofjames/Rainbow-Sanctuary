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
  GROUP_HEALING_HOST_CALENDAR_ID: "ethel@rainbowsanctuary.life",
  GROUP_HEALING_HOST_EVENT_ID: "host-series-id"
};

function response(body = {}, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function paidGroupHealingEvent() {
  return { id: "evt_group_invite_123", type: "checkout.session.completed", created: 1787043600, livemode: true, data: { object: { id: "cs_group_invite_123", payment_intent: "pi_group_invite_123", payment_status: "paid", amount_total: 2200, amount_subtotal: 2200, currency: "usd", customer_details: { email: "person@example.com", name: "Person Name" }, metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-18" } } } };
}

test("checks Ethel's host series and locks guest permissions without creating duplicate staff events", async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (options.method === "GET") return response({ id: "host-series-id" });
    return response({ id: "host-series-id" });
  };
  const result = await ensureGroupHealingStaffCalendarEvents(environment, fetchMock);
  assert.deepEqual(result, { enabled: true, hostCalendarId: "ethel@rainbowsanctuary.life", hostEventId: "host-series-id" });
  const writes = requests.filter(([url, options]) => url.includes("googleapis.com/calendar") && options.method === "PATCH");
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0][1].body), { guestsCanModify: false, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: false });
});

test("invites a paid person to only their selected session occurrence with private guest permissions", async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (url.includes("/instances?")) return response({ items: [{ id: "host-series-id_20260818T130000Z", start: { dateTime: "2026-08-18T21:00:00+08:00" }, attendees: [{ email: "ethel@rainbowsanctuary.life", organizer: true }] }] });
    return response({ id: "host-series-id_20260818T130000Z" });
  };
  const result = await syncPaidGroupHealingParticipant(paidGroupHealingEvent(), environment, fetchMock);
  assert.deepEqual(result, { enabled: true, sessionId: "group-healing-2026-08-18", occurrenceId: "host-series-id_20260818T130000Z", invited: true });
  const invite = requests.find(([url, options]) => url.includes("host-series-id_20260818T130000Z?sendUpdates=all") && options.method === "PATCH");
  assert.ok(invite);
  const body = JSON.parse(invite[1].body);
  assert.equal(body.attendees[1].email, "person@example.com");
  assert.equal(body.guestsCanModify, false);
  assert.equal(body.guestsCanInviteOthers, false);
  assert.equal(body.guestsCanSeeOtherGuests, false);
});

test("does not send a duplicate Google invitation when Stripe retries the same paid booking", async () => {
  const requests = [];
  const fetchMock = async (url, options = {}) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (url.includes("/instances?")) return response({ items: [{ id: "host-series-id_20260818T130000Z", start: { dateTime: "2026-08-18T21:00:00+08:00" }, attendees: [{ email: "person@example.com" }] }] });
    return response({ id: "host-series-id_20260818T130000Z" });
  };
  const result = await syncPaidGroupHealingParticipant(paidGroupHealingEvent(), environment, fetchMock);
  assert.equal(result.invited, false);
  assert.ok(requests.some(([url, options]) => url.includes("sendUpdates=none") && options.method === "PATCH"));
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  operationsCalendarSyncStatus,
  syncGroupHealingRegistrationToOperationsCalendar
} from "../api/_lib/google-calendar-operations.mjs";

function checkoutEvent(overrides = {}) {
  return {
    id: "evt_test_calendar_123",
    type: "checkout.session.completed",
    created: 1787208000,
    livemode: true,
    data: { object: {
      id: "cs_test_calendar_123",
      payment_intent: "pi_test_calendar_123",
      payment_status: "paid",
      amount_subtotal: 2200,
      amount_total: 2200,
      currency: "usd",
      customer_details: { email: "participant@example.com", name: "Participant Person" },
      custom_fields: [{ key: "client_display_name", text: { value: "Participant Person" } }],
      metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-22" }
    } },
    ...overrides
  };
}

const environment = {
  GOOGLE_CALENDAR_CLIENT_ID: "google-client-id",
  GOOGLE_CALENDAR_CLIENT_SECRET: "google-client-secret",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "google-refresh-token",
  RAINBOW_OPERATIONS_CALENDAR_ID: "operations@example.com",
  RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED: "true",
  STRIPE_LIVE_CHECKOUT_APPROVED: "true",
  STRIPE_SECRET_KEY: "sk_live_test_key",
  STRIPE_WEBHOOK_SECRET: "whsec_abcdefghijklmnopqrstuvwxyz123456",
  VERCEL_ENV: "production"
};

const hubspot = {
  contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/41001",
  enabled: true
};

test("only an explicitly enabled live Group Healing payment is eligible for the private Operations calendar", () => {
  assert.equal(operationsCalendarSyncStatus(checkoutEvent(), environment).eligible, true);
  assert.deepEqual(
    operationsCalendarSyncStatus(checkoutEvent(), { ...environment, RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED: "false" }),
    { eligible: false, reason: "not-enabled" }
  );
  assert.deepEqual(
    operationsCalendarSyncStatus(checkoutEvent({ data: { object: { ...checkoutEvent().data.object, metadata: { offer_key: "crystal-healing", event_id: "program-crystal-healing" } } } }), environment),
    { eligible: false, reason: "not-an-approved-group-healing-session" }
  );
});

test("a first paid booking creates one private, transparent Operations session without customer guests", async () => {
  const calls = [];
  const result = await syncGroupHealingRegistrationToOperationsCalendar(
    checkoutEvent(),
    hubspot,
    environment,
    async (url, options = {}) => {
      calls.push({ url, options });
      if (url === "https://oauth2.googleapis.com/token") return { json: async () => ({ access_token: "access-token" }), ok: true, status: 200 };
      if (options.method === "GET") return { json: async () => ({}), ok: false, status: 404 };
      return { json: async () => ({ id: "rsgrouphealing20260822" }), ok: true, status: 200 };
    }
  );
  assert.deepEqual(result, { synced: true, reason: "created", sessionId: "group-healing-2026-08-22" });
  const created = JSON.parse(calls.at(-1).options.body);
  assert.equal(created.id, "rsgrouphealing20260822");
  assert.equal(created.visibility, "private");
  assert.equal(created.transparency, "transparent");
  assert.equal(created.guestsCanSeeOtherGuests, false);
  assert.equal("attendees" in created, false);
  assert.match(created.description, /participant@example\.com/);
  assert.match(created.description, /Stripe event: evt_test_calendar_123/);
  assert.match(calls.at(-1).url, /sendUpdates=none/);
});

test("a retried Stripe event does not duplicate the private Operations roster", async () => {
  let callCount = 0;
  const existingDescription = "Bookings:\n\n• Stripe event: evt_test_calendar_123\n  Participant: Participant Person";
  const result = await syncGroupHealingRegistrationToOperationsCalendar(
    checkoutEvent(),
    hubspot,
    environment,
    async (url, options = {}) => {
      callCount += 1;
      if (url === "https://oauth2.googleapis.com/token") return { json: async () => ({ access_token: "access-token" }), ok: true, status: 200 };
      assert.equal(options.method, "GET");
      return { json: async () => ({ description: existingDescription }), ok: true, status: 200 };
    }
  );
  assert.deepEqual(result, { synced: true, reason: "already-recorded", sessionId: "group-healing-2026-08-22" });
  assert.equal(callCount, 2);
});

import test from "node:test";
import assert from "node:assert/strict";
import { addKidsWeeklyPracticeGuardian, kidsCalendarConfiguration } from "../api/_lib/kids-weekly-practice-calendar.mjs";

const environment = {
  RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED: "true",
  RAINBOW_OPERATIONS_CALENDAR_ID: "operations@example.test",
  GOOGLE_CALENDAR_CLIENT_ID: "client-id",
  GOOGLE_CALENDAR_CLIENT_SECRET: "client-secret",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh-token",
  KIDS_WEEKLY_PRACTICE_CALENDAR_EVENT_ID: "host-event-id"
};

function response(body, ok = true) {
  return { ok, json: async () => body };
}

test("Kids Weekly Practice Calendar is disabled unless the explicit production gate is enabled", () => {
  assert.deepEqual(kidsCalendarConfiguration({}), { enabled: false });
});

test("adds a guardian to the one existing host series with all guest permissions restricted", async () => {
  const requests = [];
  const fetchImplementation = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (options.method === "GET") return response({ attendees: [{ email: "existing.guardian@example.test" }] });
    if (options.method === "PATCH") return response({ id: "host-event-id" });
    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await addKidsWeeklyPracticeGuardian({
    email: "Guardian@example.test",
    environment,
    fetchImplementation
  });

  assert.deepEqual(result, { added: true, enabled: true, reason: "enrolled" });
  assert.equal(requests.length, 3);
  assert.match(requests[1].url, /events\/host-event-id$/);
  assert.match(requests[2].url, /events\/host-event-id\?sendUpdates=none$/);
  assert.deepEqual(JSON.parse(requests[2].options.body), {
    attendees: [{ email: "existing.guardian@example.test" }, { email: "guardian@example.test" }],
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false
  });
});

test("does not duplicate a guardian already attending the host series", async () => {
  let patchCalled = false;
  const fetchImplementation = async (url, options = {}) => {
    if (url === "https://oauth2.googleapis.com/token") return response({ access_token: "token" });
    if (options.method === "GET") return response({ attendees: [{ email: "guardian@example.test" }] });
    if (options.method === "PATCH") patchCalled = true;
    return response({});
  };

  const result = await addKidsWeeklyPracticeGuardian({
    email: "guardian@example.test",
    environment,
    fetchImplementation
  });

  assert.deepEqual(result, { added: false, enabled: true, reason: "already-enrolled" });
  assert.equal(patchCalled, false);
});

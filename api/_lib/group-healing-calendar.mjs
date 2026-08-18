import { crmPaymentHandoff, isInternalPaymentTest, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { groupHealingScheduleDetails } from "./group-healing-schedule.mjs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function enabled(environment) {
  return environment.RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED === "true";
}

function configuration(environment) {
  const clientId = String(environment.GOOGLE_CALENDAR_CLIENT_ID || "").trim();
  const clientSecret = String(environment.GOOGLE_CALENDAR_CLIENT_SECRET || "").trim();
  const refreshToken = String(environment.GOOGLE_CALENDAR_REFRESH_TOKEN || "").trim();
  const hostCalendarId = String(environment.GROUP_HEALING_HOST_CALENDAR_ID || "ethel@rainbowsanctuary.life").trim();
  const hostEventId = String(environment.GROUP_HEALING_HOST_EVENT_ID || "55cb5htv7fan98lr4vanb5h37k").trim();
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Google Calendar operations sync is not configured.");
  if (!hostCalendarId || !hostEventId) throw new Error("Group Healing host calendar is not configured.");
  return { clientId, clientSecret, refreshToken, hostCalendarId, hostEventId };
}

async function accessToken(config, fetchImplementation) {
  const response = await fetchImplementation(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) throw new Error(`Google Calendar OAuth refresh failed with status ${response.status}.`);
  const body = await response.json();
  if (typeof body.access_token !== "string" || !body.access_token) throw new Error("Google Calendar OAuth did not return an access token.");
  return body.access_token;
}

async function googleRequest(path, { method = "GET", body, token }, fetchImplementation) {
  const response = await fetchImplementation(`${GOOGLE_CALENDAR_API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (response.status === 404) return { missing: true };
  if (!response.ok) throw new Error(`Google Calendar request failed with status ${response.status}.`);
  return response.status === 204 ? {} : response.json();
}

function escaped(value) {
  return encodeURIComponent(value);
}

function occurrenceQuery(event) {
  const parameters = new URLSearchParams({
    timeMin: event.start,
    timeMax: event.end,
    maxResults: "5"
  });
  return parameters.toString();
}

/** Resolves a booking to one occurrence, not the recurring master series. */
async function selectedOccurrence(config, event, token, fetchImplementation) {
  const response = await googleRequest(
    `/calendars/${escaped(config.hostCalendarId)}/events/${escaped(config.hostEventId)}/instances?${occurrenceQuery(event)}`,
    { token },
    fetchImplementation
  );
  const selectedStart = Date.parse(event.start);
  const matches = (response.items || []).filter(
    (item) => Number.isFinite(selectedStart) && Date.parse(item?.start?.dateTime) === selectedStart
  );
  if (matches.length !== 1) throw new Error("The selected Group Healing calendar occurrence could not be found.");
  return matches[0];
}

function attendeesWithParticipant(existingAttendees, customer) {
  const normalized = customer.email.toLowerCase();
  const attendees = Array.isArray(existingAttendees) ? existingAttendees : [];
  if (attendees.some((attendee) => String(attendee.email || "").toLowerCase() === normalized)) return attendees;
  return [...attendees, { email: customer.email, displayName: customer.displayName, responseStatus: "needsAction" }];
}

/**
 * Checks Ethel's existing host series and locks its guest privacy. It never
 * creates an alternate event, so Ethel has one unambiguous event to host.
 */
export async function ensureGroupHealingStaffCalendarEvents(environment = process.env, fetchImplementation = fetch) {
  if (!enabled(environment)) return { enabled: false, reason: "disabled" };
  const config = configuration(environment);
  const token = await accessToken(config, fetchImplementation);
  const host = await googleRequest(
    `/calendars/${escaped(config.hostCalendarId)}/events/${escaped(config.hostEventId)}`,
    { token },
    fetchImplementation
  );
  if (host.missing) throw new Error("The configured Group Healing host event could not be found.");
  await googleRequest(
    `/calendars/${escaped(config.hostCalendarId)}/events/${escaped(config.hostEventId)}?sendUpdates=none`,
    {
      method: "PATCH",
      body: { guestsCanModify: false, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: false },
      token
    },
    fetchImplementation
  );
  return { enabled: true, hostCalendarId: config.hostCalendarId, hostEventId: config.hostEventId };
}

/**
 * Adds a paid customer to their selected Ethel-hosted Zoom occurrence. Google
 * sends the event invitation; guests cannot edit, invite others, or see the
 * guest list. A repeat webhook does not send a duplicate calendar invitation.
 */
export async function syncPaidGroupHealingParticipant(stripeEvent, environment = process.env, fetchImplementation = fetch) {
  if (isInternalPaymentTest(stripeEvent) || !enabled(environment)) return { enabled: false, reason: "disabled-or-test" };
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive: livePaymentProcessingAllowed(environment) });
  if (handoff.offerId !== "group-healing") return { enabled: false, reason: "not-group-healing" };
  const event = groupHealingScheduleDetails(handoff.sessionId);
  if (!event) throw new Error("Group Healing participant has no approved session.");
  const config = configuration(environment);
  const token = await accessToken(config, fetchImplementation);
  const occurrence = await selectedOccurrence(config, event, token, fetchImplementation);
  const attendees = attendeesWithParticipant(occurrence.attendees, handoff.customer);
  const alreadyInvited = attendees.length === (occurrence.attendees || []).length;
  await googleRequest(
    `/calendars/${escaped(config.hostCalendarId)}/events/${escaped(occurrence.id)}?sendUpdates=${alreadyInvited ? "none" : "all"}`,
    {
      method: "PATCH",
      body: { attendees, guestsCanModify: false, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: false },
      token
    },
    fetchImplementation
  );
  return { enabled: true, sessionId: handoff.sessionId, occurrenceId: occurrence.id, invited: !alreadyInvited };
}

import { createHash } from "node:crypto";
import { crmPaymentHandoff, isInternalPaymentTest, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { groupHealingScheduleDetails } from "./group-healing-schedule.mjs";
import { groupHealingZoomJoinUrl } from "./group-healing-zoom.mjs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const DEFAULT_OPERATIONS_CALENDAR_ID = "c_8c06ed271e76489612837b0ff0e06b8c48b1c9205e4263903f6319f75db81b10@group.calendar.google.com";
const DEFAULT_PSN_CALENDAR_ID = "c_9f46da2ecb079c736bd3a573a54f60074cbdefc406e861f333a2bba31133edb3@group.calendar.google.com";
const DEFAULT_OPERATIONS_EVENT_ID = "m6galvun5efuib7knu6g6j6h2k";
// Google Calendar event IDs are restricted to base32-compatible lowercase
// characters (a-v and 0-9). Keep this staff-only master ID deterministic so
// the recurring PSN event can be safely upserted on every sync.
const DEFAULT_PSN_EVENT_ID = "grouphealingpsn";

function enabled(environment) {
  return environment.RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED === "true";
}

function configuration(environment) {
  const clientId = String(environment.GOOGLE_CALENDAR_CLIENT_ID || "").trim();
  const clientSecret = String(environment.GOOGLE_CALENDAR_CLIENT_SECRET || "").trim();
  const refreshToken = String(environment.GOOGLE_CALENDAR_REFRESH_TOKEN || "").trim();
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Google Calendar operations sync is not configured.");
  return {
    clientId,
    clientSecret,
    refreshToken,
    operationsCalendarId: String(environment.RAINBOW_OPERATIONS_CALENDAR_ID || DEFAULT_OPERATIONS_CALENDAR_ID).trim(),
    psnCalendarId: String(environment.PSN_TEAM_CALENDAR_ID || DEFAULT_PSN_CALENDAR_ID).trim(),
    operationsEventId: String(environment.GROUP_HEALING_OPERATIONS_EVENT_ID || DEFAULT_OPERATIONS_EVENT_ID).trim(),
    psnEventId: String(environment.GROUP_HEALING_PSN_EVENT_ID || DEFAULT_PSN_EVENT_ID).trim()
  };
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

function eventBody(event, zoomUrl) {
  return {
    summary: "Online Group Healing — Grounding & Renewal",
    description: `Rainbow Sanctuary Online Group Healing\n\nWeekly guided Zoom session. Tuesday, 9:00 PM Asia/Makassar / Beijing (GMT+8).\n\nZoom host link (staff and paid participants only): ${zoomUrl}\n\nPaid participants are tracked in separate private roster entries. Do not add customers as Google Calendar guests.`,
    location: "Zoom — private link in staff description and paid participant emails",
    start: { dateTime: event.start, timeZone: "Asia/Makassar" },
    end: { dateTime: event.end, timeZone: "Asia/Makassar" },
    visibility: "private",
    transparency: "opaque",
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
    recurrence: ["RRULE:FREQ=WEEKLY;COUNT=53;BYDAY=TU"]
  };
}

function rosterEventId(stripeEventId, calendarId) {
  return `rsg${createHash("sha256").update(`${stripeEventId}:${calendarId}`).digest("hex").slice(0, 42)}`;
}

function rosterBody({ handoff, event, zoomUrl }) {
  return {
    summary: `Paid Group Healing participant — ${handoff.customer.displayName}`,
    description: `Internal Rainbow Sanctuary roster entry.\n\nParticipant: ${handoff.customer.displayName}\nEmail: ${handoff.customer.email}\nSession: ${event.title}\nScheduled: ${event.date}, ${event.time} ${event.timezone}\nBooking reference: ${handoff.bookingReference}\n\nZoom link (do not forward): ${zoomUrl}`,
    start: { dateTime: event.start, timeZone: "Asia/Makassar" },
    end: { dateTime: event.end, timeZone: "Asia/Makassar" },
    visibility: "private",
    transparency: "transparent",
    extendedProperties: { private: { source: "rainbow-sanctuary-stripe", stripe_event_id: handoff.stripeEventId, booking_reference: handoff.bookingReference } }
  };
}

async function upsertEvent(calendarId, eventId, body, token, fetchImplementation) {
  const encodedCalendar = encodeURIComponent(calendarId);
  const encodedEvent = encodeURIComponent(eventId);
  const existing = await googleRequest(`/calendars/${encodedCalendar}/events/${encodedEvent}`, { token }, fetchImplementation);
  if (existing.missing) {
    return googleRequest(`/calendars/${encodedCalendar}/events?sendUpdates=none`, { method: "POST", body: { id: eventId, ...body }, token }, fetchImplementation);
  }
  return googleRequest(`/calendars/${encodedCalendar}/events/${encodedEvent}?sendUpdates=none`, { method: "PATCH", body, token }, fetchImplementation);
}

/** Ensures both private staff calendars contain the recurring Zoom-host event. */
export async function ensureGroupHealingStaffCalendarEvents(environment = process.env, fetchImplementation = fetch) {
  if (!enabled(environment)) return { enabled: false, reason: "disabled" };
  const config = configuration(environment);
  const zoomUrl = groupHealingZoomJoinUrl(environment);
  const event = groupHealingScheduleDetails("group-healing-2026-08-18");
  const token = await accessToken(config, fetchImplementation);
  const body = eventBody(event, zoomUrl);
  await Promise.all([
    upsertEvent(config.operationsCalendarId, config.operationsEventId, body, token, fetchImplementation),
    upsertEvent(config.psnCalendarId, config.psnEventId, body, token, fetchImplementation)
  ]);
  return { enabled: true, operationsCalendarId: config.operationsCalendarId, psnCalendarId: config.psnCalendarId };
}

/** Adds paid people as private, staff-only roster records—not event attendees. */
export async function syncPaidGroupHealingParticipant(stripeEvent, environment = process.env, fetchImplementation = fetch) {
  if (isInternalPaymentTest(stripeEvent) || !enabled(environment)) return { enabled: false, reason: "disabled-or-test" };
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive: livePaymentProcessingAllowed(environment) });
  if (handoff.offerId !== "group-healing") return { enabled: false, reason: "not-group-healing" };
  const event = groupHealingScheduleDetails(handoff.sessionId);
  if (!event) throw new Error("Group Healing participant has no approved session.");
  const config = configuration(environment);
  const zoomUrl = groupHealingZoomJoinUrl(environment);
  const token = await accessToken(config, fetchImplementation);
  const body = rosterBody({ handoff, event, zoomUrl });
  await Promise.all([
    upsertEvent(config.operationsCalendarId, rosterEventId(handoff.stripeEventId, config.operationsCalendarId), body, token, fetchImplementation),
    upsertEvent(config.psnCalendarId, rosterEventId(handoff.stripeEventId, config.psnCalendarId), body, token, fetchImplementation)
  ]);
  return { enabled: true, sessionId: handoff.sessionId, staffCalendars: 2 };
}

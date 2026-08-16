import { crmPaymentHandoff, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { resolveOfferVariant } from "./offer-catalog.mjs";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_ORIGIN = "https://www.googleapis.com/calendar/v3";

// Calendar event IDs must use Google's restricted lowercase alphabet. Keeping
// a stable ID makes Stripe retries idempotent and means Ethel has one private
// operational record per session rather than one event per payment.
const APPROVED_GROUP_HEALING_OPERATIONS_EVENTS = new Map([
  ["group-healing-2026-08-22", {
    end: "2026-08-22T21:00:00+08:00",
    googleEventId: "rsgrouphealing20260822",
    start: "2026-08-22T20:00:00+08:00",
    summary: "Online Group Healing — Grounding & Renewal (Operations)",
    timezone: "Asia/Makassar"
  }]
]);

function calendarUrl(calendarId, path = "") {
  return `${GOOGLE_CALENDAR_API_ORIGIN}/calendars/${encodeURIComponent(calendarId)}/events${path}`;
}

function calendarSyncEnabled(environment = {}) {
  return environment.RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED === "true" &&
    environment.VERCEL_ENV === "production" &&
    livePaymentProcessingAllowed(environment);
}

function requireConfiguration(environment) {
  const calendarId = String(environment.RAINBOW_OPERATIONS_CALENDAR_ID || "").trim();
  const clientId = String(environment.GOOGLE_CALENDAR_CLIENT_ID || "").trim();
  const clientSecret = String(environment.GOOGLE_CALENDAR_CLIENT_SECRET || "").trim();
  const refreshToken = String(environment.GOOGLE_CALENDAR_REFRESH_TOKEN || "").trim();
  if (!calendarId || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Rainbow Operations Google Calendar sync is not configured.");
  }
  return { calendarId, clientId, clientSecret, refreshToken };
}

function registrationMarker(stripeEventId) {
  return `Stripe event: ${stripeEventId}`;
}

function participantLine(handoff, hubspot) {
  return [
    `• ${registrationMarker(handoff.stripeEventId)}`,
    `  Participant: ${handoff.customer.displayName}`,
    `  Email: ${handoff.customer.email}`,
    `  HubSpot: ${hubspot.contactUrl}`,
    `  Paid: USD ${(handoff.amountMinor / 100).toFixed(2)} · ${handoff.occurredAt}`
  ].join("\n");
}

function baseDescription(session) {
  return [
    "Private Rainbow Sanctuary operations record.",
    "Participant details below are visible only to authorised Operations calendar staff. Do not add clients as Google Calendar guests.",
    "",
    `Session: ${session.summary.replace(" (Operations)", "")}`,
    "Bookings:"
  ].join("\n");
}

function createEventPayload(session, description) {
  return {
    id: session.googleEventId,
    summary: session.summary,
    description,
    start: { dateTime: session.start, timeZone: session.timezone },
    end: { dateTime: session.end, timeZone: session.timezone },
    visibility: "private",
    transparency: "transparent",
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
    extendedProperties: {
      private: {
        rainbow_operations_record: "group-healing",
        rainbow_session_id: session.googleEventId
      }
    }
  };
}

async function googleAccessToken(configuration, fetchImplementation) {
  const response = await fetchImplementation(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      grant_type: "refresh_token",
      refresh_token: configuration.refreshToken
    }).toString()
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("Rainbow Operations Google Calendar authorization failed.");
  }
  return body.access_token;
}

async function calendarRequest(url, accessToken, options, fetchImplementation) {
  const response = await fetchImplementation(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(options?.headers || {})
    }
  });
  if (response.status === 404) return { missing: true };
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Rainbow Operations Google Calendar request failed with status ${response.status}.`);
  return { body, missing: false };
}

function groupHealingRegistration(stripeEvent, environment) {
  const handoff = crmPaymentHandoff(stripeEvent, {
    allowLive: livePaymentProcessingAllowed(environment)
  });
  const offer = resolveOfferVariant(handoff.offerId);
  const session = APPROVED_GROUP_HEALING_OPERATIONS_EVENTS.get(handoff.sessionId);
  if (offer.policy !== "group-healing" || !session) return null;
  return { handoff, session };
}

export function operationsCalendarSyncStatus(stripeEvent, environment = {}) {
  const registration = groupHealingRegistration(stripeEvent, environment);
  if (!registration) return { eligible: false, reason: "not-an-approved-group-healing-session" };
  if (!calendarSyncEnabled(environment)) return { eligible: false, reason: "not-enabled" };
  return { eligible: true, registration };
}

export async function syncGroupHealingRegistrationToOperationsCalendar(
  stripeEvent,
  hubspot,
  environment,
  fetchImplementation = fetch
) {
  const status = operationsCalendarSyncStatus(stripeEvent, environment);
  if (!status.eligible) return { synced: false, reason: status.reason };
  if (!hubspot?.enabled || !hubspot.contactUrl) {
    throw new Error("A HubSpot contact is required before the Operations calendar can be updated.");
  }

  const { handoff, session } = status.registration;
  const configuration = requireConfiguration(environment);
  const accessToken = await googleAccessToken(configuration, fetchImplementation);
  const eventUrl = calendarUrl(configuration.calendarId, `/${encodeURIComponent(session.googleEventId)}`);
  const current = await calendarRequest(eventUrl, accessToken, { method: "GET" }, fetchImplementation);
  const marker = registrationMarker(handoff.stripeEventId);

  if (!current.missing && String(current.body.description || "").includes(marker)) {
    return { synced: true, reason: "already-recorded", sessionId: handoff.sessionId };
  }

  const description = [
    current.missing ? baseDescription(session) : String(current.body.description || baseDescription(session)),
    "",
    participantLine(handoff, hubspot)
  ].join("\n");

  if (current.missing) {
    await calendarRequest(
      `${calendarUrl(configuration.calendarId)}?sendUpdates=none`,
      accessToken,
      { body: JSON.stringify(createEventPayload(session, description)), method: "POST" },
      fetchImplementation
    );
    return { synced: true, reason: "created", sessionId: handoff.sessionId };
  }

  await calendarRequest(
    `${eventUrl}?sendUpdates=none`,
    accessToken,
    {
      body: JSON.stringify({ description }),
      headers: current.body.etag ? { "if-match": current.body.etag } : {},
      method: "PATCH"
    },
    fetchImplementation
  );
  return { synced: true, reason: "updated", sessionId: handoff.sessionId };
}

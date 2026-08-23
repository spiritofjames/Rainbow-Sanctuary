const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(value, message) {
  const result = String(value || "").trim();
  if (!result) throw new Error(message);
  return result;
}

export function kidsCalendarConfiguration(environment = process.env) {
  if (environment.RAINBOW_OPERATIONS_CALENDAR_SYNC_ENABLED !== "true") {
    return { enabled: false };
  }
  return {
    calendarId: required(environment.RAINBOW_OPERATIONS_CALENDAR_ID, "Rainbow Operations calendar is not configured."),
    clientId: required(environment.GOOGLE_CALENDAR_CLIENT_ID, "Google Calendar client ID is not configured."),
    clientSecret: required(environment.GOOGLE_CALENDAR_CLIENT_SECRET, "Google Calendar client secret is not configured."),
    eventId: required(environment.KIDS_WEEKLY_PRACTICE_CALENDAR_EVENT_ID, "Children’s Weekly Practice host event is not configured."),
    refreshToken: required(environment.GOOGLE_CALENDAR_REFRESH_TOKEN, "Google Calendar refresh token is not configured."),
    enabled: true
  };
}

async function accessToken(configuration, fetchImplementation) {
  const response = await fetchImplementation(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      grant_type: "refresh_token",
      refresh_token: configuration.refreshToken
    }).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });
  if (!response.ok) throw new Error("Google Calendar authorization could not be refreshed.");
  const body = await response.json();
  return required(body.access_token, "Google Calendar authorization did not return an access token.");
}

function eventUrl(configuration) {
  return `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(configuration.calendarId)}/events/${encodeURIComponent(configuration.eventId)}`;
}

/**
 * Adds a guardian to the one pre-existing host series. The child name and
 * WhatsApp number deliberately remain outside Google Calendar: Ethel can see
 * attendance in the Operations calendar without exposing children's details.
 */
export async function addKidsWeeklyPracticeGuardian({ email, environment = process.env, fetchImplementation = fetch }) {
  const guardianEmail = String(email || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(guardianEmail)) throw new Error("A guardian email is required for calendar enrolment.");
  const configuration = kidsCalendarConfiguration(environment);
  if (!configuration.enabled) return { enabled: false, reason: "disabled" };

  const token = await accessToken(configuration, fetchImplementation);
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const existingResponse = await fetchImplementation(eventUrl(configuration), { headers, method: "GET" });
  if (!existingResponse.ok) throw new Error("The Children’s Weekly Practice host event could not be read.");
  const event = await existingResponse.json();
  const attendees = Array.isArray(event.attendees) ? event.attendees : [];
  if (attendees.some((attendee) => String(attendee.email || "").toLowerCase() === guardianEmail)) {
    return { added: false, enabled: true, reason: "already-enrolled" };
  }
  const patchResponse = await fetchImplementation(`${eventUrl(configuration)}?sendUpdates=none`, {
    body: JSON.stringify({
      attendees: attendees.concat([{ email: guardianEmail }]),
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false
    }),
    headers,
    method: "PATCH"
  });
  if (!patchResponse.ok) throw new Error("The guardian could not be added to the Children’s Weekly Practice host event.");
  return { added: true, enabled: true, reason: "enrolled" };
}

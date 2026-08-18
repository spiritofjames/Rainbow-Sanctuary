import { sendJson } from "../_lib/http.mjs";
import { ensureGroupHealingStaffCalendarEvents } from "../_lib/group-healing-calendar.mjs";
import { groupHealingReminderRequestIsAuthorized } from "../_lib/group-healing-reminders.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!groupHealingReminderRequestIsAuthorized(request, process.env)) return sendJson(response, 401, { error: "Unauthorized." });
  try {
    return sendJson(response, 200, await ensureGroupHealingStaffCalendarEvents(process.env));
  } catch (error) {
    console.error("group_healing_host_calendar_privacy_sync_failed", { message: error.message });
    return sendJson(response, 500, { error: "Group Healing host calendar privacy could not be updated." });
  }
}

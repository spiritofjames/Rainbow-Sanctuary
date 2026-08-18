import Stripe from "stripe";
import { sendJson } from "../_lib/http.mjs";
import { groupHealingReminderRequestIsAuthorized, sendGroupHealingOneHourReminders } from "../_lib/group-healing-reminders.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!groupHealingReminderRequestIsAuthorized(request, process.env)) return sendJson(response, 401, { error: "Unauthorized." });
  if (process.env.GROUP_HEALING_REMINDERS_ENABLED !== "true") return sendJson(response, 200, { enabled: false });
  if (!process.env.STRIPE_SECRET_KEY) return sendJson(response, 503, { error: "Stripe is not configured." });
  try {
    const result = await sendGroupHealingOneHourReminders({ stripe: new Stripe(process.env.STRIPE_SECRET_KEY), environment: process.env });
    console.info("group_healing_one_hour_reminders_completed", result);
    return sendJson(response, 200, { enabled: true, ...result });
  } catch (error) {
    console.error("group_healing_one_hour_reminders_failed", { message: error.message });
    return sendJson(response, 500, { error: "Group Healing reminders could not be processed." });
  }
}

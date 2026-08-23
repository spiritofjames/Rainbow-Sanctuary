import Stripe from "stripe";
import { sendJson } from "../_lib/http.mjs";
import { cronRequestIsAuthorized } from "../_lib/regeneration-maintenance-reminders.mjs";
import { sendKidsWeeklyPracticeOneHourReminders } from "../_lib/kids-weekly-practice-reminders.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") { response.setHeader("Allow", "GET"); return sendJson(response, 405, { error: "Method not allowed." }); }
  if (!cronRequestIsAuthorized(request, process.env)) return sendJson(response, 401, { error: "Unauthorized." });
  if (process.env.KIDS_WEEKLY_PRACTICE_REMINDERS_ENABLED !== "true") return sendJson(response, 200, { enabled: false });
  if (!process.env.STRIPE_SECRET_KEY) return sendJson(response, 503, { error: "Stripe is not configured." });
  try {
    const result = await sendKidsWeeklyPracticeOneHourReminders({ stripe: new Stripe(process.env.STRIPE_SECRET_KEY), environment: process.env });
    console.info("kids_weekly_practice_reminders_completed", result);
    return sendJson(response, 200, { enabled: true, ...result });
  } catch (error) {
    console.error("kids_weekly_practice_reminders_failed", { message: error.message });
    return sendJson(response, 500, { error: "Children’s Weekly Practice reminders could not be processed." });
  }
}

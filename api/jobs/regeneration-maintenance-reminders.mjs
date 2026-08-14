import Stripe from "stripe";
import { sendJson } from "../_lib/http.mjs";
import { cronRequestIsAuthorized, sendRegenerationMaintenanceDayOfReminders } from "../_lib/regeneration-maintenance-reminders.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!cronRequestIsAuthorized(request, process.env)) return sendJson(response, 401, { error: "Unauthorized." });
  if (process.env.REGENERATION_MAINTENANCE_REMINDERS_ENABLED !== "true") return sendJson(response, 200, { enabled: false });
  if (!process.env.STRIPE_SECRET_KEY) return sendJson(response, 503, { error: "Stripe is not configured." });

  try {
    const result = await sendRegenerationMaintenanceDayOfReminders({ stripe: new Stripe(process.env.STRIPE_SECRET_KEY), environment: process.env });
    console.info("regeneration_maintenance_reminders_completed", result);
    return sendJson(response, 200, { enabled: true, ...result });
  } catch (error) {
    console.error("regeneration_maintenance_reminders_failed", { message: error.message });
    return sendJson(response, 500, { error: "Maintenance reminders could not be processed." });
  }
}

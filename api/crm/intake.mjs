import { assertAllowedOrigin } from "../_lib/checkout-policy.mjs";
import { forwardWebsiteIntake, normalizePublicIntake } from "../_lib/crm-intake.mjs";
import { mirrorHubSpotIntake } from "../_lib/hubspot-intake.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";

function safeFailureReason(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("not enabled")) return "intake-disabled";
  if (message.includes("origin")) return "origin-policy";
  if (message.includes("invalid") || message.includes("required") || message.includes("consent") || message.includes("prohibited")) {
    return "invalid-submission";
  }
  if (message.includes("crm intake is not configured")) return "crm-configuration";
  if (message.includes("crm intake failed")) return "crm-upstream";
  if (message.includes("hubspot intake is not configured")) return "hubspot-configuration";
  if (message.includes("hubspot contact")) return "hubspot-contact";
  if (message.includes("hubspot form")) return "hubspot-form";
  return "unexpected-upstream";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  try {
    if (process.env.CRM_WEBSITE_INTAKE_ENABLED !== "true") {
      throw new Error("Website intake is not enabled.");
    }
    assertAllowedOrigin(request, {
      ...process.env,
      STRIPE_ALLOWED_CHECKOUT_ORIGINS: process.env.CRM_ALLOWED_INTAKE_ORIGINS
    });
    const input = parseJsonBody(request);
    await forwardWebsiteIntake(input, process.env);
    await mirrorHubSpotIntake(normalizePublicIntake(input), process.env);
    return sendJson(response, 202, { accepted: true });
  } catch (error) {
    const expected = /not enabled|not configured|not allowed|origin|required|invalid|private healing|consent|prohibited/i.test(error.message);
    console.error("crm_intake_error", {
      category: expected ? "rejected" : "upstream-unavailable",
      reason: safeFailureReason(error)
    });
    return sendJson(response, expected ? 400 : 502, {
      error: expected
        ? "This enquiry path is not available yet. No information was saved."
        : "The private CRM is temporarily unavailable. Please try again later."
    });
  }
}

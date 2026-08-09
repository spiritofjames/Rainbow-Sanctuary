import { assertAllowedOrigin } from "../_lib/checkout-policy.mjs";
import { forwardWebsiteIntake, normalizePublicIntake } from "../_lib/crm-intake.mjs";
import { mirrorHubSpotIntake } from "../_lib/hubspot-intake.mjs";
import { sendEnquiryOperationsNotification } from "../_lib/operations-notification.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";
import { parseMultipartIntake } from "../_lib/private-intake.mjs";

function safeFailureReason(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("not enabled")) return "intake-disabled";
  if (message.includes("origin")) return "origin-policy";
  if (message.includes("invalid") || message.includes("required") || message.includes("consent") || message.includes("prohibited")) {
    return "invalid-submission";
  }
  if (message.includes("crm intake is not configured")) return "crm-configuration";
  if (message.includes("crm intake failed")) return "crm-upstream";
  if (message.includes("hubspot private intake is not configured")) return "hubspot-private-configuration";
  if (message.includes("hubspot intake is not configured")) return "hubspot-configuration";
  if (message.includes("hubspot contact")) return "hubspot-contact";
  if (message.includes("hubspot form")) return "hubspot-form";
  if (message.includes("hubspot private file")) return "hubspot-private-file";
  if (message.includes("hubspot private note")) return "hubspot-private-note";
  if (message.includes("operations notification") || message.includes("operational recipient")) return "operations-notification";
  return "unexpected-upstream";
}

async function parseIntakeRequest(request) {
  const contentType = String(request.headers?.["content-type"] || "").toLowerCase();
  if (contentType.startsWith("multipart/form-data;")) return parseMultipartIntake(request);
  return { attachment: null, input: parseJsonBody(request) };
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
    const { attachment, input } = await parseIntakeRequest(request);
    const isPrivate = input?.reason === "private-healing";
    if (isPrivate && process.env.HUBSPOT_PRIVATE_INTAKE_ENABLED !== "true") {
      throw new Error("HubSpot private intake is not configured.");
    }
    if (isPrivate && !attachment) throw new Error("Private headshot is required.");
    if (!isPrivate && attachment) throw new Error("Invalid private intake request.");
    const normalized = normalizePublicIntake(input, new Date(), {
      allowPrivateHealing: isPrivate
    });
    await forwardWebsiteIntake(input, process.env);
    const hubspot = await mirrorHubSpotIntake(normalized, process.env, fetch, attachment);
    await sendEnquiryOperationsNotification(normalized, hubspot, process.env);
    return sendJson(response, 202, { accepted: true });
  } catch (error) {
    const operationalFailure = /operations notification|operational recipient/i.test(error.message);
    const expected = !operationalFailure && /not enabled|not configured|not allowed|origin|required|invalid|private healing|private headshot|consent|prohibited/i.test(error.message);
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

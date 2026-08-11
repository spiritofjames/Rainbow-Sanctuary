import { assertAllowedOrigin } from "../_lib/checkout-policy.mjs";
import { forwardWebsiteIntake, normalizePublicIntake } from "../_lib/crm-intake.mjs";
import { mirrorHubSpotIntake } from "../_lib/hubspot-intake.mjs";
import { attemptAutismRegistrationReceipt, attemptEnquiryOperationsNotification } from "../_lib/operations-notification.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";
import { parseMultipartIntake } from "../_lib/private-intake.mjs";

function safeFailureReason(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("not enabled")) return "intake-disabled";
  if (message.includes("origin")) return "origin-policy";
  if (message.includes("invalid") || message.includes("required") || message.includes("consent") || message.includes("prohibited") || message.includes("protected participant") || message.includes("autism registration")) {
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

function safeUpstreamStatus(error) {
  const match = String(error?.message || "").match(/status (\d{3})\b/i);
  return match ? Number(match[1]) : null;
}

function safeValidationDetail(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("timestamp")) return "timestamp";
  if (message.includes("fields")) return "fields";
  if (message.includes("consent")) return "consent";
  if (message.includes("prohibited")) return "prohibited-data";
  if (message.includes("headshot")) return "headshot";
  if (message.includes("protected participant")) return "protected-participant-photo";
  if (message.includes("autism registration")) return "autism-registration-gate";
  if (message.includes("private healing")) return "private-healing-gate";
  return null;
}

async function parseIntakeRequest(request) {
  const contentType = String(request.headers?.["content-type"] || "").toLowerCase();
  if (contentType.startsWith("multipart/form-data;")) return parseMultipartIntake(request);
  return { attachment: null, input: parseJsonBody(request) };
}

function privateApplicationDetails(input, intake) {
  const currentChallenges = String(input?.currentChallenges || "").trim();
  const intendedOutcome = String(input?.intendedOutcome || "").trim();
  if (
    !intake.program ||
    currentChallenges.length < 1 || currentChallenges.length > 1500 ||
    intendedOutcome.length < 1 || intendedOutcome.length > 1500
  ) throw new Error("Invalid private healing application details.");
  return { currentChallenges, intendedOutcome, session: intake.program };
}

function autismRegistrationDetails(input, intake) {
  const participantName = String(input?.participantName || "").trim();
  const participantCountry = String(input?.participantCountry || "").trim();
  const participantAge = Number(input?.participantAge);
  if (
    intake.program !== "autism-family-support" ||
    participantName.length < 1 || participantName.length > 120 ||
    participantCountry.length < 1 || participantCountry.length > 80 ||
    !Number.isInteger(participantAge) || participantAge < 1 || participantAge > 120
  ) throw new Error("Invalid Autism registration details.");
  return { participantAge, participantCountry, participantName };
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
    const isAutismRegistration = input?.reason === "family" && input?.program === "autism-family-support";
    const requiresProtectedAttachment = isPrivate || isAutismRegistration;
    if (requiresProtectedAttachment && process.env.HUBSPOT_PRIVATE_INTAKE_ENABLED !== "true") {
      throw new Error("HubSpot private intake is not configured.");
    }
    if (requiresProtectedAttachment && !attachment) throw new Error("Protected participant photo is required.");
    if (!requiresProtectedAttachment && attachment) throw new Error("Invalid private intake request.");
    const normalized = normalizePublicIntake(input, new Date(), {
      allowPrivateHealing: isPrivate,
      allowAutismRegistration: isAutismRegistration
    });
    const privateApplication = isPrivate ? privateApplicationDetails(input, normalized) : null;
    const autismRegistration = isAutismRegistration ? autismRegistrationDetails(input, normalized) : null;
    await forwardWebsiteIntake(input, process.env);
    const hubspot = await mirrorHubSpotIntake(normalized, process.env, fetch, attachment, privateApplication || autismRegistration);
    await attemptEnquiryOperationsNotification(normalized, hubspot, process.env);
    if (isAutismRegistration) await attemptAutismRegistrationReceipt(normalized, process.env);
    return sendJson(response, 202, { accepted: true });
  } catch (error) {
    const operationalFailure = /operations notification|operational recipient/i.test(error.message);
    const expected = !operationalFailure && /not enabled|not configured|not allowed|origin|required|invalid|private healing|private headshot|protected participant|autism registration|consent|prohibited/i.test(error.message);
    console.error("crm_intake_error", {
      category: expected ? "rejected" : "upstream-unavailable",
      reason: safeFailureReason(error),
      validation: safeValidationDetail(error),
      upstreamStatus: safeUpstreamStatus(error)
    });
    return sendJson(response, expected ? 400 : 502, {
      error: expected
        ? "This enquiry path is not available yet. No information was saved."
        : "The private CRM is temporarily unavailable. Please try again later."
    });
  }
}

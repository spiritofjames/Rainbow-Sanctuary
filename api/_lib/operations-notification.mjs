import { emailHtml, emailText, escapeHtml } from "../../emails/layout.mjs";
import { sendOperationalEmail, sendTransactionalEmail } from "./email-service.mjs";
import { crmPaymentHandoff, isInternalPaymentTest, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { resolveOfferVariant } from "./offer-catalog.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_DONATION_FOLLOW_UP_PROGRAMS = new Set(["autism-family-support"]);

function operationsRecipient(environment) {
  const recipient = String(environment.RAINBOW_OPERATIONS_EMAIL || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(recipient) || !recipient.endsWith("@rainbowsanctuary.life")) {
    throw new Error("Rainbow operations notification is not configured.");
  }
  return recipient;
}

function safeContactUrl(hubspot) {
  if (hubspot?.enabled !== true || !/^https:\/\/app-na2\.hubspot\.com\//.test(hubspot.contactUrl || "")) {
    throw new Error("HubSpot contact link is unavailable for operations.");
  }
  return hubspot.contactUrl;
}

function intakePathwayLabel(intake) {
  const source = String(intake.program || intake.area || "Rainbow Sanctuary enquiry").trim();
  return source
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function visitorIntakeReceipt(intake) {
  const isPrivateHealing = intake.area === "private-healing";
  const pathway = intakePathwayLabel(intake);
  return {
    alias: isPrivateHealing ? "rs-application-received" : "rs-enquiry-received",
    idempotencyKey: `intake:${intake.eventId}:visitor-received`,
    tags: [{ name: "workflow", value: isPrivateHealing ? "application" : "enquiry" }],
    to: intake.email,
    variables: isPrivateHealing
      ? { NAME: intake.displayName, PATHWAY: pathway, REFERENCE_ID: intake.eventId }
      : { ENQUIRY_TOPIC: pathway, NAME: intake.displayName, REFERENCE_ID: intake.eventId }
  };
}

export function enquiryOperationsMessage(intake, hubspot, environment) {
  const program = intake.program || intake.area;
  const content = {
    preheader: "A new Rainbow Sanctuary enquiry is ready for review.",
    eyebrow: "Operations · New enquiry",
    heading: "A new enquiry is ready.",
    greeting: `Hello Ethel,`,
    paragraphs: [
      `${escapeHtml(intake.displayName)} submitted a ${escapeHtml(program)} enquiry. Open the owned HubSpot contact to review the approved intake details and decide the next step.`,
      "The notification intentionally excludes the enquiry message and any attachment. Review confidential details only in the approved system."
    ],
    details: [
      { label: "Programme", value: escapeHtml(program) },
      { label: "Reference", value: escapeHtml(intake.eventId) }
    ],
    cta: { label: "Open contact in HubSpot", url: safeContactUrl(hubspot) },
    closing: "Rainbow Sanctuary Operations"
  };
  return {
    html: emailHtml(content),
    identity: "general",
    idempotencyKey: `intake:${intake.eventId}:operations`,
    subject: `New Rainbow Sanctuary enquiry — ${program}`,
    tags: [{ name: "workflow", value: "enquiry" }],
    text: emailText(content),
    to: operationsRecipient(environment)
  };
}

export function autismRegistrationReceipt(intake) {
  const content = {
    preheader: "Autism & Family Support registration is complete.",
    eyebrow: "Weekly registration complete",
    heading: "The participant is on the weekly list.",
    greeting: `Hello ${escapeHtml(intake.displayName)},`,
    paragraphs: [
      "We have received the free Autism & Family Support registration and added the participant to the weekly list.",
      "The practice is held each Tuesday at 11:00 PM Beijing time (UTC+8). At the corresponding local time, please create a restful, familiar space. There is no Zoom session or live attendance requirement."
    ],
    details: [
      { label: "Pathway", value: "Autism & Family Support" },
      { label: "Reference", value: escapeHtml(intake.eventId) }
    ],
    callout: "This is a non-clinical wellbeing practice and does not replace healthcare, educational, therapeutic, or crisis support.",
    closing: "Rainbow Sanctuary"
  };
  return {
    html: emailHtml(content),
    identity: "general",
    idempotencyKey: `intake:${intake.eventId}:autism-registration`,
    subject: "Autism & Family Support registration confirmed",
    tags: [{ name: "workflow", value: "autism_registration" }],
    text: emailText(content),
    to: intake.email
  };
}

export function optionalContributionFollowUp(intake) {
  if (!FREE_DONATION_FOLLOW_UP_PROGRAMS.has(intake.program) || intake.privacyAcceptedAt === undefined) {
    throw new Error("This registration is not eligible for a contribution follow-up.");
  }
  if (!Number.isFinite(Date.parse(intake.followUpAt))) {
    throw new Error("A contribution follow-up schedule is required.");
  }
  const content = {
    preheader: "An optional way to support free-access pathways.",
    eyebrow: "A note from Rainbow Sanctuary",
    heading: "Help keep free access open, if you wish.",
    greeting: `Hello ${escapeHtml(intake.displayName)},`,
    paragraphs: [
      "Thank you for being part of Autism & Family Support. This is one optional follow-up, sent the day after registration because you gave permission for email follow-up.",
      "If you would like to contribute, your gift helps us keep free, donation-based pathways open for families and people who need them. The amount is entirely your choice, and no contribution is expected."
    ],
    cta: { label: "Contribute if you wish", url: "https://rainbowsanctuary.life/contribute" },
    callout: "No action is needed. We will not send another contribution invitation from this registration.",
    closing: "With appreciation,<br>Rainbow Sanctuary"
  };
  return {
    html: emailHtml(content),
    identity: "contributions",
    idempotencyKey: `intake:${intake.eventId}:optional-contribution-follow-up`,
    scheduledAt: intake.followUpAt,
    subject: "An optional way to support free access",
    tags: [
      { name: "workflow", value: "free_registration_contribution_follow_up" },
      { name: "programme", value: "autism_family_support" }
    ],
    text: emailText(content),
    to: intake.email
  };
}

export function purchaseOperationsMessage(stripeEvent, hubspot, environment) {
  const handoff = crmPaymentHandoff(stripeEvent, {
    allowLive: livePaymentProcessingAllowed(environment)
  });
  const offer = resolveOfferVariant(handoff.offerId);
  const content = {
    preheader: "A verified Rainbow Sanctuary payment is ready for follow-up.",
    eyebrow: "Operations · Payment received",
    heading: "A payment has been received.",
    greeting: "Hello Ethel,",
    paragraphs: [
      `${escapeHtml(handoff.customer.displayName)} completed payment for ${escapeHtml(offer.name)}. Stripe and the private Rainbow CRM remain the financial authority.`,
      "Open the owned HubSpot contact to continue participant follow-up. This notification contains no financial credentials."
    ],
    details: [
      { label: "Amount", value: `USD ${(handoff.amountMinor / 100).toFixed(2)}` },
      { label: "Reference", value: escapeHtml(handoff.bookingReference) }
    ],
    cta: { label: "Open contact in HubSpot", url: safeContactUrl(hubspot) },
    closing: "Rainbow Sanctuary Operations"
  };
  return {
    html: emailHtml(content),
    identity: "bookings",
    idempotencyKey: `stripe:${handoff.stripeEventId}:operations`,
    subject: `Payment received — ${offer.name}`,
    tags: [{ name: "workflow", value: "payment" }],
    text: emailText(content),
    to: operationsRecipient(environment)
  };
}

export async function sendEnquiryOperationsNotification(intake, hubspot, environment, resendClient) {
  const result = await sendOperationalEmail(enquiryOperationsMessage(intake, hubspot, environment), environment, resendClient);
  if (!result.sent) throw new Error("Rainbow operations notification is not enabled.");
  return result;
}

export async function attemptEnquiryOperationsNotification(
  intake,
  hubspot,
  environment,
  resendClient,
  logger = console
) {
  try {
    return await sendEnquiryOperationsNotification(intake, hubspot, environment, resendClient);
  } catch (error) {
    logger.error("crm_intake_notification_error", {
      reason: "operations-notification-unavailable"
    });
    return { reason: "operations-notification-unavailable", sent: false };
  }
}

export async function attemptVisitorIntakeReceipt(intake, environment, resendClient, logger = console) {
  try {
    const result = await sendTransactionalEmail(visitorIntakeReceipt(intake), environment, resendClient);
    if (!result.sent) {
      logger.error("crm_intake_visitor_receipt_error", {
        eventId: intake.eventId,
        reason: result.reason || "receipt-unavailable"
      });
    }
    return result;
  } catch (error) {
    logger.error("crm_intake_visitor_receipt_error", {
      eventId: intake.eventId,
      reason: "receipt-unavailable"
    });
    return { reason: "receipt-unavailable", sent: false };
  }
}

export async function attemptAutismRegistrationReceipt(intake, environment, resendClient, logger = console) {
  try {
    const result = await sendOperationalEmail(autismRegistrationReceipt(intake), environment, resendClient);
    return result;
  } catch (error) {
    logger.error("autism_registration_receipt_error", { reason: "receipt-unavailable" });
    return { reason: "receipt-unavailable", sent: false };
  }
}

export async function attemptOptionalContributionFollowUp(intake, environment, resendClient, logger = console) {
  if (!FREE_DONATION_FOLLOW_UP_PROGRAMS.has(intake.program)) {
    return { reason: "not-a-free-donation-programme", sent: false };
  }
  try {
    return await sendOperationalEmail(optionalContributionFollowUp(intake), environment, resendClient);
  } catch (error) {
    logger.error("optional_contribution_follow_up_error", { reason: "follow-up-unavailable" });
    return { reason: "follow-up-unavailable", sent: false };
  }
}

export async function sendPurchaseOperationsNotification(stripeEvent, hubspot, environment, resendClient) {
  const result = await sendOperationalEmail(purchaseOperationsMessage(stripeEvent, hubspot, environment), environment, resendClient);
  if (!result.sent) throw new Error("Rainbow operations notification is not enabled.");
  return result;
}

export async function attemptPurchaseOperationsNotification(
  stripeEvent,
  hubspot,
  environment,
  resendClient,
  logger = console
) {
  if (isInternalPaymentTest(stripeEvent)) return { reason: "internal-payment-test", sent: false };
  try {
    return await sendPurchaseOperationsNotification(stripeEvent, hubspot, environment, resendClient);
  } catch (error) {
    logger.error("stripe_operations_notification_error", {
      eventId: stripeEvent.id,
      reason: "operations-notification-unavailable"
    });
    return { reason: "operations-notification-unavailable", sent: false };
  }
}

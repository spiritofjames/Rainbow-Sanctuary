import { emailHtml, emailText, escapeHtml } from "../../emails/layout.mjs";
import { sendOperationalEmail } from "./email-service.mjs";
import { crmPaymentHandoff } from "./webhook-delivery.mjs";
import { resolveOfferVariant } from "./offer-catalog.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function purchaseOperationsMessage(stripeEvent, hubspot, environment) {
  const handoff = crmPaymentHandoff(stripeEvent);
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

export async function sendPurchaseOperationsNotification(stripeEvent, hubspot, environment, resendClient) {
  const result = await sendOperationalEmail(purchaseOperationsMessage(stripeEvent, hubspot, environment), environment, resendClient);
  if (!result.sent) throw new Error("Rainbow operations notification is not enabled.");
  return result;
}

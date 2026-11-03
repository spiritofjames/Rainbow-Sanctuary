// This URL is owner-supplied. Never accept a payment destination from a form.
export const KARMA_PAYMENT_LINK = "https://book.stripe.com/3cIdR9dEd1mdfU15ov3Nm0q";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isKarmaBooking(intake) {
  return intake?.area === "private-healing" && intake?.program === "karma";
}

export function karmaApplicationReference(value) {
  return UUID_PATTERN.test(String(value || "")) ? String(value) : "";
}

export function karmaPaymentUrl(reference) {
  if (!karmaApplicationReference(reference)) throw new Error("Invalid Karma application reference.");
  const url = new URL(KARMA_PAYMENT_LINK);
  // Reconciliation only, never evidence of payment or permission to retrieve data.
  // No contact details, answers, image URL or credentials belong in this URL.
  url.searchParams.set("client_reference_id", reference);
  return url.href;
}

export function savedKarmaPaymentUrl(intake, hubspot) {
  if (!isKarmaBooking(intake)) return null;
  if (hubspot?.enabled !== true || hubspot?.attachmentStored !== true || !/^\d+$/.test(String(hubspot?.contactId || ""))) {
    throw new Error("HubSpot private intake is not configured or saved.");
  }
  return karmaPaymentUrl(intake.eventId);
}

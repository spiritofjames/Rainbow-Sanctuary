import { createHmac } from "node:crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9][0-9\s().-]{6,20}$/;
const PROHIBITED_PATTERN = /\b(?:password|passphrase|recovery\s*code|api[_\s]*key|access\s*token|private\s*key|client\s*secret|card\s*number|card|cvv|cvc)\b\s*[:=]/i;
const FULL_CARD_PATTERN = /\b(?:\d[ -]*?){12,19}\b/;
const PATHWAYS = new Map([
  ["certification", "practitioner"],
  ["earth-healing", "partnership"],
  ["events", "retreat"],
  ["family", "family"],
  ["group-healing", "program"],
  ["other", "other"],
  ["spiral", "program"],
  ["vision", "partnership"],
  ["workshop", "program"]
]);

const clean = (value) => typeof value === "string" ? value.trim() : "";

export function normalizePublicIntake(input, receivedAt = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid enquiry.");
  if (input.reason === "private-healing") {
    throw new Error("Private healing requires the approved confidential intake provider.");
  }
  const displayName = clean(input.name);
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.whatsapp);
  const requestMessage = clean(input.message);
  const privacyPolicyVersion = clean(input.privacyPolicyVersion);
  const sourcePage = clean(input.sourcePage);
  const pathway = PATHWAYS.get(input.reason);
  const eventId = clean(input.clientEventId);
  const text = [displayName, email, phone, requestMessage, privacyPolicyVersion, sourcePage];
  if (input.privacyAccepted !== true) throw new Error("Privacy consent is required.");
  if (
    !UUID_PATTERN.test(eventId) ||
    displayName.length < 1 || displayName.length > 120 ||
    !EMAIL_PATTERN.test(email) || email.length > 254 ||
    !PHONE_PATTERN.test(phone) ||
    requestMessage.length < 1 || requestMessage.length > 2000 ||
    !pathway ||
    !sourcePage.startsWith("/") || sourcePage.length > 300 ||
    privacyPolicyVersion.length < 1 || privacyPolicyVersion.length > 80
  ) throw new Error("Invalid enquiry fields.");
  if (text.some((value) => PROHIBITED_PATTERN.test(value) || FULL_CARD_PATTERN.test(value))) {
    throw new Error("Prohibited credential or payment-card data.");
  }
  const occurredAt = receivedAt.toISOString();
  return {
    displayName,
    email,
    eventId,
    followUpAt: new Date(receivedAt.getTime() + 86_400_000).toISOString(),
    occurredAt,
    pathway,
    phone,
    preferredContact: "whatsapp",
    privacyAcceptedAt: occurredAt,
    privacyPolicyVersion,
    requestMessage,
    schemaVersion: "rainbow.website-intake.v1",
    sourcePage
  };
}

export async function forwardWebsiteIntake(
  input,
  environment,
  fetchImplementation = fetch,
  clock = () => new Date(),
  clockSeconds = () => Math.floor(Date.now() / 1000)
) {
  const endpoint = environment.CRM_WEBSITE_INTAKE_URL;
  const secret = environment.CRM_WEBSITE_INTAKE_SECRET;
  let url;
  try { url = new URL(endpoint); } catch { throw new Error("CRM intake is not configured."); }
  if (url.protocol !== "https:" || typeof secret !== "string" || secret.length < 32) {
    throw new Error("CRM intake is not configured.");
  }
  const body = JSON.stringify(normalizePublicIntake(input, clock()));
  const timestamp = clockSeconds();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const response = await fetchImplementation(url.toString(), {
    body,
    headers: {
      "content-type": "application/json",
      "x-rainbow-intake-signature": `t=${timestamp},v1=${signature}`
    },
    method: "POST"
  });
  if (!response.ok) throw new Error(`CRM intake failed with status ${response.status}.`);
  return { accepted: true };
}

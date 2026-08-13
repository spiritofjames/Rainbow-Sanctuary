import { crmPaymentHandoff, isInternalPaymentTest, livePaymentProcessingAllowed } from "./webhook-delivery.mjs";
import { resolveOfferVariant } from "./offer-catalog.mjs";

const HUBSPOT_API_ORIGIN = "https://api.hubapi.com";
const NUMERIC_ID_PATTERN = /^\d+$/;

function splitName(displayName) {
  const [firstname, ...remainder] = displayName.trim().split(/\s+/);
  return { firstname, lastname: remainder.join(" ") };
}

function requireConfiguration(environment) {
  const token = environment.HUBSPOT_ACCESS_TOKEN;
  const ownerId = environment.HUBSPOT_OWNER_ID;
  const portalId = environment.HUBSPOT_PORTAL_ID;
  if (
    typeof token !== "string" || !token.startsWith("pat-") || token.length < 30 ||
    !NUMERIC_ID_PATTERN.test(ownerId || "") ||
    !NUMERIC_ID_PATTERN.test(portalId || "")
  ) throw new Error("HubSpot payment mirror is not configured.");
  return { ownerId, portalId, token };
}

async function responseJson(response) {
  try { return await response.json(); } catch { throw new Error("HubSpot payment contact upsert returned an invalid response."); }
}

export function toHubSpotPurchaseProperties(stripeEvent, ownerId, { allowLive = false } = {}) {
  const handoff = crmPaymentHandoff(stripeEvent, { allowLive });
  const variant = resolveOfferVariant(handoff.offerId);
  const allowsSelectedEvent = variant.policy === "group-healing";
  if (
    variant.amountMinor !== handoff.amountMinor ||
    (!allowsSelectedEvent && variant.sessionId !== handoff.sessionId)
  ) {
    throw new Error("The HubSpot payment mirror does not match the approved catalogue.");
  }
  const { firstname, lastname } = splitName(handoff.customer.displayName);
  return {
    area_of_interest: ["group-healing", "regeneration-maintenance"].includes(variant.policy) ? "Group healing" : "Program guidance",
    email: handoff.customer.email,
    enquiry_details: `Payment received for ${variant.name}. Reference: ${handoff.bookingReference}. Financial authority: Stripe and the private Rainbow CRM.`,
    firstname,
    hubspot_owner_id: ownerId,
    lastname,
    lifecyclestage: "customer",
    program_or_offering: variant.offer.name
  };
}

export async function mirrorHubSpotPurchase(stripeEvent, environment, fetchImplementation = fetch) {
  if (isInternalPaymentTest(stripeEvent)) return { enabled: false, reason: "internal-payment-test" };
  if (environment.HUBSPOT_INTAKE_ENABLED !== "true") return { enabled: false };
  const { ownerId, portalId, token } = requireConfiguration(environment);
  const properties = toHubSpotPurchaseProperties(stripeEvent, ownerId, {
    allowLive: livePaymentProcessingAllowed(environment)
  });
  const response = await fetchImplementation(`${HUBSPOT_API_ORIGIN}/crm/v3/objects/contacts/batch/upsert`, {
    body: JSON.stringify({
      inputs: [{
        id: properties.email,
        idProperty: "email",
        objectWriteTraceId: stripeEvent.id,
        properties
      }]
    }),
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    method: "POST"
  });
  if (!response.ok) throw new Error(`HubSpot payment contact upsert failed with status ${response.status}.`);
  const upserted = await responseJson(response);
  const contactId = String(upserted.results?.[0]?.id || "");
  if (!NUMERIC_ID_PATTERN.test(contactId)) throw new Error("HubSpot payment contact upsert returned an invalid response.");
  return {
    contactId,
    contactUrl: `https://app-na2.hubspot.com/contacts/${portalId}/record/0-1/${contactId}`,
    enabled: true,
    ownerId
  };
}

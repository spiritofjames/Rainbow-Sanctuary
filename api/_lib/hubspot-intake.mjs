const HUBSPOT_API_ORIGIN = "https://api.hubapi.com";
const HUBSPOT_FORMS_ORIGIN = "https://api.hsforms.com";
const FORM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_ID_PATTERN = /^\d+$/;

const AREA_LABELS = new Map([
  ["certification", "Program guidance"],
  ["earth-healing", "Program guidance"],
  ["events", "Workshop or event"],
  ["family", "Program guidance"],
  ["group-healing", "Group healing"],
  ["other", "Other"],
  ["spiral", "Program guidance"],
  ["vision", "Other"],
  ["workshop", "Workshop or event"]
]);

const PROGRAM_LABELS = new Map([
  ["adult-potential-development", "Adult Potential Development"],
  ["awakening-inner-light-2026", "Awakening Your Inner Light Retreat 2026"],
  ["childrens-potential-coach-certification", "Children’s Potential Coach Certification"],
  ["crystal-healing", "Crystal Healing"],
  ["dna-activation", "DNA Activation"],
  ["earth-healer-training", "Earth Healer Training"],
  ["earth-healing-zone", "Earth Healing Zone"],
  ["family-information-field-restoration", "Family Information Field Restoration"],
  ["holographic-healing", "Holographic Healing"],
  ["intuitive-perception-training", "Intuitive Perception Training"],
  ["online-group-healing", "Online Group Healing"],
  ["personal-karma-reconciliation", "Personal Karma Reconciliation"],
  ["practitioner-certification", "Practitioner Certification"],
  ["rainbow-light-codes", "Rainbow Light Codes"],
  ["regeneration", "ReGeneration"],
  ["spiral-i", "Spiral I — Foundations"],
  ["spiral-ii", "Spiral II — Relationships"],
  ["spiral-iii", "Spiral III — Direction"],
  ["spiral-iv", "Spiral IV — Leadership"],
  ["unlock-the-potential", "Unlock the Potential"]
]);

function splitName(displayName) {
  const [firstname, ...remainder] = displayName.trim().split(/\s+/);
  return { firstname, lastname: remainder.join(" ") };
}

function requireConfiguration(environment) {
  const token = environment.HUBSPOT_ACCESS_TOKEN;
  const ownerId = environment.HUBSPOT_OWNER_ID;
  const portalId = environment.HUBSPOT_PORTAL_ID;
  const formId = environment.HUBSPOT_FORM_ID;
  if (
    typeof token !== "string" || !token.startsWith("pat-") || token.length < 30 ||
    !NUMERIC_ID_PATTERN.test(ownerId || "") ||
    !NUMERIC_ID_PATTERN.test(portalId || "") ||
    !FORM_ID_PATTERN.test(formId || "")
  ) throw new Error("HubSpot intake is not configured.");
  return { formId, ownerId, portalId, token };
}

export function toHubSpotProperties(intake, ownerId) {
  const { firstname, lastname } = splitName(intake.displayName);
  const program = intake.program
    ? (PROGRAM_LABELS.get(intake.program) || "Other / Not sure yet")
    : (intake.area === "group-healing" ? "Online Group Healing" : "Other / Not sure yet");
  return {
    area_of_interest: AREA_LABELS.get(intake.area) || "Other",
    email: intake.email,
    enquiry_details: intake.requestMessage,
    firstname,
    hubspot_owner_id: ownerId,
    lastname,
    phone: intake.phone,
    program_or_offering: program
  };
}

export async function mirrorHubSpotIntake(intake, environment, fetchImplementation = fetch) {
  if (environment.HUBSPOT_INTAKE_ENABLED !== "true") return { enabled: false };
  const { formId, ownerId, portalId, token } = requireConfiguration(environment);
  const properties = toHubSpotProperties(intake, ownerId);
  const authorization = { authorization: `Bearer ${token}`, "content-type": "application/json" };

  const upsertResponse = await fetchImplementation(`${HUBSPOT_API_ORIGIN}/crm/v3/objects/contacts/batch/upsert`, {
    body: JSON.stringify({ inputs: [{ id: intake.email, idProperty: "email", properties }] }),
    headers: authorization,
    method: "POST"
  });
  if (!upsertResponse.ok) throw new Error(`HubSpot contact upsert failed with status ${upsertResponse.status}.`);

  const fields = Object.entries(properties)
    .filter(([name]) => name !== "hubspot_owner_id")
    .map(([name, value]) => ({ name, objectTypeId: "0-1", value }));
  const formResponse = await fetchImplementation(`${HUBSPOT_FORMS_ORIGIN}/submissions/v3/integration/submit/${portalId}/${formId}`, {
    body: JSON.stringify({
      context: {
        pageName: "Rainbow Sanctuary enquiry",
        pageUri: `https://rainbowsanctuary.life${intake.sourcePage}`
      },
      fields,
      legalConsentOptions: {
        consent: {
          communications: [],
          consentToProcess: true,
          text: "I allow Rainbow Sanctuary to store and process this enquiry so the team can respond."
        }
      },
      submittedAt: Date.parse(intake.occurredAt)
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  if (!formResponse.ok) throw new Error(`HubSpot form submission failed with status ${formResponse.status}.`);
  return { enabled: true, ownerId };
}

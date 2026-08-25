const HUBSPOT_API_ORIGIN = "https://api.hubapi.com";
const NUMERIC_ID_PATTERN = /^\d+$/;

const AREA_LABELS = new Map([
  ["certification", "Program guidance"],
  ["earth-healing", "Program guidance"],
  ["events", "Workshop or event"],
  ["family", "Program guidance"],
  ["group-healing", "Group healing"],
  ["other", "Other"],
  ["private-healing", "Program guidance"],
  ["spiral", "Program guidance"],
  ["vision", "Other"],
  ["workshop", "Workshop or event"]
]);

const PROGRAM_LABELS = new Map([
  ["adult-potential-development", "Adult Potential Development"],
  ["autism-family-support", "Autism & Family Support"],
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
  ["karma", "Personal Karma Reconciliation"],
  ["family-field", "Family Information Field Restoration"],
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function privateHealingNote({ intake, retention, application }) {
  const days = retention.slice(1, -1);
  const session = PROGRAM_LABELS.get(application?.session || intake.program) || "Not specified";
  const challenges = application?.currentChallenges || intake.requestMessage || "Not specified";
  const intendedOutcome = application?.intendedOutcome || "Not specified";
  return [
    "<h3>Private Healing application</h3>",
    `<p><strong>Requested session</strong><br>${escapeHtml(session)}</p>`,
    `<p><strong>Current challenges</strong><br>${escapeHtml(challenges).replaceAll("\n", "<br>")}</p>`,
    `<p><strong>Intended outcome</strong><br>${escapeHtml(intendedOutcome).replaceAll("\n", "<br>")}</p>`,
    `<p><strong>Preferred contact</strong><br>WhatsApp: ${escapeHtml(intake.phone)}</p>`,
    `<p><strong>Headshot</strong><br>Attached to this restricted note. It is automatically deleted after ${days} days. Do not download or duplicate outside the approved case workflow.</p>`,
    `<p><small>Explicit consent recorded · Submission reference: ${escapeHtml(intake.eventId)}</small></p>`
  ].join("");
}

function autismRegistrationNote({ intake, retention, application }) {
  const days = retention.slice(1, -1);
  return [
    "<h3>Autism &amp; Family Support registration</h3>",
    `<p><strong>Participant name</strong><br>${escapeHtml(application?.participantName)}</p>`,
    `<p><strong>Age</strong><br>${escapeHtml(application?.participantAge)}</p>`,
    `<p><strong>Country</strong><br>${escapeHtml(application?.participantCountry)}</p>`,
    `<p><strong>Parent or guardian contact</strong><br>${escapeHtml(intake.displayName)} · WhatsApp: ${escapeHtml(intake.phone)}</p>`,
    "<p><strong>Schedule and preparation</strong><br>Weekly Tuesday, 11:00 PM Beijing time (UTC+8). Parent or guardian confirmed a restful, familiar space at the corresponding local time.</p>",
    `<p><strong>Participant photo</strong><br>Attached to this restricted note. It is automatically deleted after ${days} days. Do not download or duplicate outside the approved case workflow.</p>`,
    `<p><small>Parent or guardian consent recorded · Registration reference: ${escapeHtml(intake.eventId)}</small></p>`
  ].join("");
}

function requireConfiguration(environment) {
  const token = environment.HUBSPOT_ACCESS_TOKEN;
  const ownerId = environment.HUBSPOT_OWNER_ID;
  const portalId = environment.HUBSPOT_PORTAL_ID;
  if (
    typeof token !== "string" || !token.startsWith("pat-") || token.length < 30 ||
    !NUMERIC_ID_PATTERN.test(ownerId || "") ||
    !NUMERIC_ID_PATTERN.test(portalId || "")
  ) throw new Error("HubSpot intake is not configured.");
  return { ownerId, portalId, token };
}

function requirePrivateIntakeConfiguration(environment) {
  if (environment.HUBSPOT_PRIVATE_INTAKE_ENABLED !== "true") {
    throw new Error("HubSpot private intake is not configured.");
  }
  const retention = environment.HUBSPOT_PRIVATE_INTAKE_TTL || "P30D";
  if (!/^P(?:[1-9]|[12]\d|30)D$/.test(retention)) {
    throw new Error("HubSpot private intake is not configured.");
  }
  return { retention };
}

async function responseJson(response, failureMessage) {
  try { return await response.json(); } catch { throw new Error(failureMessage); }
}

async function attachPrivateHeadshot({ application, attachment, contactId, intake, ownerId, retention, token }, fetchImplementation) {
  const isAutismRegistration = intake.program === "autism-family-support";
  const uploadBody = new FormData();
  uploadBody.append("file", new Blob([attachment.buffer], { type: attachment.mimeType }), `${intake.eventId}.${attachment.extension}`);
  uploadBody.append("fileName", `${intake.eventId}.${attachment.extension}`);
  uploadBody.append("folderPath", isAutismRegistration ? "/rainbow-sanctuary/autism-family-registration" : "/rainbow-sanctuary/private-healing-intake");
  uploadBody.append("options", JSON.stringify({
    access: "PRIVATE",
    duplicateValidationScope: "EXACT_FOLDER",
    duplicateValidationStrategy: "RETURN_EXISTING",
    ttl: retention
  }));
  const uploadResponse = await fetchImplementation(`${HUBSPOT_API_ORIGIN}/files/v3/files`, {
    body: uploadBody,
    headers: { authorization: `Bearer ${token}` },
    method: "POST"
  });
  if (!uploadResponse.ok) throw new Error(`HubSpot private file upload failed with status ${uploadResponse.status}.`);
  const uploaded = await responseJson(uploadResponse, "HubSpot private file upload returned an invalid response.");
  if (!NUMERIC_ID_PATTERN.test(String(uploaded.id || ""))) {
    throw new Error("HubSpot private file upload returned an invalid response.");
  }

  const noteResponse = await fetchImplementation(`${HUBSPOT_API_ORIGIN}/crm/v3/objects/notes`, {
    body: JSON.stringify({
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }]
      }],
      properties: {
        hs_attachment_ids: String(uploaded.id),
        hs_note_body: isAutismRegistration
          ? autismRegistrationNote({ application, intake, retention })
          : privateHealingNote({ application, intake, retention }),
        hs_timestamp: intake.occurredAt,
        hubspot_owner_id: ownerId
      }
    }),
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    method: "POST"
  });
  if (!noteResponse.ok) throw new Error(`HubSpot private note creation failed with status ${noteResponse.status}.`);
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

export async function mirrorHubSpotIntake(intake, environment, fetchImplementation = fetch, attachment = null, application = null) {
  if (environment.HUBSPOT_INTAKE_ENABLED !== "true") {
    // A protected participant image must never be accepted unless the private
    // HubSpot handoff is active. Public enquiries may remain independently
    // operable when the optional mirror is disabled.
    if (attachment) throw new Error("HubSpot private intake is not configured.");
    return { enabled: false };
  }
  const { ownerId, portalId, token } = requireConfiguration(environment);
  const privateConfiguration = attachment ? requirePrivateIntakeConfiguration(environment) : null;
  const properties = toHubSpotProperties(intake, ownerId);
  const authorization = { authorization: `Bearer ${token}`, "content-type": "application/json" };

  const upsertResponse = await fetchImplementation(`${HUBSPOT_API_ORIGIN}/crm/v3/objects/contacts/batch/upsert`, {
    body: JSON.stringify({ inputs: [{ id: intake.email, idProperty: "email", properties }] }),
    headers: authorization,
    method: "POST"
  });
  if (!upsertResponse.ok) throw new Error(`HubSpot contact upsert failed with status ${upsertResponse.status}.`);
  const upserted = await responseJson(upsertResponse, "HubSpot contact upsert returned an invalid response.");
  const contactId = String(upserted.results?.[0]?.id || "");
  if (!NUMERIC_ID_PATTERN.test(contactId)) throw new Error("HubSpot contact upsert returned an invalid response.");
  if (attachment) {
    await attachPrivateHeadshot({
      attachment,
      application,
      contactId,
      intake,
      ownerId,
      retention: privateConfiguration.retention,
      token
    }, fetchImplementation);
  }

  return {
    attachmentStored: Boolean(attachment),
    contactId,
    contactUrl: `https://app-na2.hubspot.com/contacts/${portalId}/record/0-1/${contactId}`,
    enabled: true,
    ownerId
  };
}

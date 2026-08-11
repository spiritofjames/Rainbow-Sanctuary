import test from "node:test";
import assert from "node:assert/strict";
import { mirrorHubSpotIntake, toHubSpotProperties } from "../api/_lib/hubspot-intake.mjs";

const intake = {
  area: "spiral",
  displayName: "Synthetic Ethel Owner",
  email: "synthetic@example.test",
  occurredAt: "2026-08-09T02:00:00.000Z",
  phone: "+1 555 123 4567",
  program: "spiral-i",
  requestMessage: "I would like to understand Spiral I.",
  sourcePage: "/apply?reason=spiral&program=spiral-i"
};

const environment = {
  HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough",
  HUBSPOT_FORM_ID: "276bbe5c-a5d3-4e4e-ac93-aeb39275cc51",
  HUBSPOT_INTAKE_ENABLED: "true",
  HUBSPOT_OWNER_ID: "166816652",
  HUBSPOT_PORTAL_ID: "246920029"
};

test("website enquiry maps to Ethel and exact HubSpot taxonomy", () => {
  assert.deepEqual(toHubSpotProperties(intake, "166816652"), {
    area_of_interest: "Program guidance",
    email: "synthetic@example.test",
    enquiry_details: "I would like to understand Spiral I.",
    firstname: "Synthetic",
    hubspot_owner_id: "166816652",
    lastname: "Ethel Owner",
    phone: "+1 555 123 4567",
    program_or_offering: "Spiral I — Foundations"
  });
});

test("HubSpot mirror idempotently upserts the Ethel-owned contact without duplicate form activity", async () => {
  const calls = [];
  const result = await mirrorHubSpotIntake(intake, environment, async (url, options) => {
    calls.push({ body: JSON.parse(options.body), headers: options.headers, url });
    return { json: async () => ({ results: [{ id: "41001" }] }), ok: true, status: 200 };
  });
  assert.deepEqual(result, {
    attachmentStored: false,
    contactId: "41001",
    contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/41001",
    enabled: true,
    ownerId: "166816652"
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /contacts\/batch\/upsert$/);
  assert.equal(calls[0].body.inputs[0].idProperty, "email");
  assert.equal(calls[0].body.inputs[0].properties.hubspot_owner_id, "166816652");
  assert.equal(calls[0].headers.authorization, `Bearer ${environment.HUBSPOT_ACCESS_TOKEN}`);
});

test("private healing uploads a private expiring file and attaches it to Ethel's contact note", async () => {
  const calls = [];
  const privateIntake = {
    ...intake,
    area: "private-healing",
    eventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
    program: "karma",
    requestMessage: "Requested session: karma",
    sourcePage: "/apply?reason=private-healing&session=karma"
  };
  const privateEnvironment = {
    ...environment,
    HUBSPOT_PRIVATE_INTAKE_ENABLED: "true",
    HUBSPOT_PRIVATE_INTAKE_TTL: "P30D"
  };
  const attachment = {
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05]),
    extension: "jpg",
    mimeType: "image/jpeg"
  };
  const result = await mirrorHubSpotIntake(privateIntake, privateEnvironment, async (url, options) => {
    calls.push({ options, url });
    if (url.endsWith("contacts/batch/upsert")) {
      return { json: async () => ({ results: [{ id: "41001" }] }), ok: true, status: 200 };
    }
    if (url.endsWith("/files/2026-03/files")) {
      return { json: async () => ({ id: "51001" }), ok: true, status: 201 };
    }
    return { ok: true, status: 200 };
  }, attachment, {
    currentChallenges: "I feel stuck in an old pattern.",
    intendedOutcome: "I would like to understand a supportive next step.",
    session: "karma"
  });

  assert.deepEqual(result, {
    attachmentStored: true,
    contactId: "41001",
    contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/41001",
    enabled: true,
    ownerId: "166816652"
  });
  assert.equal(calls.length, 3);
  assert.match(calls[1].url, /files\/2026-03\/files$/);
  assert.equal(calls[1].options.body.get("folderPath"), "/rainbow-sanctuary/private-healing-intake");
  assert.deepEqual(JSON.parse(calls[1].options.body.get("options")), {
    access: "PRIVATE",
    duplicateValidationScope: "EXACT_FOLDER",
    duplicateValidationStrategy: "RETURN_EXISTING",
    ttl: "P30D"
  });
  assert.equal(calls[1].options.headers["content-type"], undefined);
  const note = JSON.parse(calls[2].options.body);
  assert.match(calls[2].url, /crm\/objects\/2026-03\/notes$/);
  assert.equal(note.associations[0].to.id, "41001");
  assert.equal(note.associations[0].types[0].associationTypeId, 202);
  assert.equal(note.properties.hs_attachment_ids, "51001");
  assert.equal(note.properties.hubspot_owner_id, "166816652");
  assert.match(note.properties.hs_note_body, /Private Healing application/);
  assert.match(note.properties.hs_note_body, /Personal Karma Reconciliation/);
  assert.match(note.properties.hs_note_body, /stuck in an old pattern/);
  assert.match(note.properties.hs_note_body, /supportive next step/);
  assert.match(note.properties.hs_note_body, /WhatsApp: \+1 555 123 4567/);
  assert.match(note.properties.hs_note_body, /30 days/);
});

test("Autism registration uses the same private thirty-day storage with a structured guardian note", async () => {
  const calls = [];
  const autismIntake = {
    ...intake,
    area: "family",
    eventId: "12e9e9fd-367f-4f92-a6d2-bbe8e977d398",
    program: "autism-family-support",
    requestMessage: "Autism & Family Support weekly registration",
    sourcePage: "/apply?reason=family&program=autism-family-support"
  };
  const privateEnvironment = {
    ...environment,
    HUBSPOT_PRIVATE_INTAKE_ENABLED: "true",
    HUBSPOT_PRIVATE_INTAKE_TTL: "P30D"
  };
  const attachment = {
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05]),
    extension: "jpg",
    mimeType: "image/jpeg"
  };
  await mirrorHubSpotIntake(autismIntake, privateEnvironment, async (url, options) => {
    calls.push({ options, url });
    if (url.endsWith("contacts/batch/upsert")) return { json: async () => ({ results: [{ id: "41001" }] }), ok: true, status: 200 };
    if (url.endsWith("/files/2026-03/files")) return { json: async () => ({ id: "51001" }), ok: true, status: 201 };
    return { ok: true, status: 200 };
  }, attachment, { participantAge: 9, participantCountry: "Panama", participantName: "Alex" });

  assert.equal(calls[1].options.body.get("folderPath"), "/rainbow-sanctuary/autism-family-registration");
  const note = JSON.parse(calls[2].options.body);
  assert.match(note.properties.hs_note_body, /Autism &amp; Family Support registration/);
  assert.match(note.properties.hs_note_body, /Alex/);
  assert.match(note.properties.hs_note_body, /Panama/);
  assert.match(note.properties.hs_note_body, /11:00 PM Beijing time/);
  assert.match(note.properties.hs_note_body, /30 days/);
});

test("private attachment fails before side effects when the private intake gate is absent", async () => {
  let called = false;
  await assert.rejects(
    () => mirrorHubSpotIntake(intake, environment, async () => { called = true; }, { buffer: Buffer.alloc(12) }),
    /private intake is not configured/i
  );
  assert.equal(called, false);
});

test("HubSpot mirror is disabled by default and fails closed when enabled without credentials", async () => {
  assert.deepEqual(await mirrorHubSpotIntake(intake, {}), { enabled: false });
  await assert.rejects(() => mirrorHubSpotIntake(intake, { HUBSPOT_INTAKE_ENABLED: "true" }), /not configured/i);
});

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

test("HubSpot mirror upserts the owned contact before recording the form submission", async () => {
  const calls = [];
  const result = await mirrorHubSpotIntake(intake, environment, async (url, options) => {
    calls.push({ body: JSON.parse(options.body), headers: options.headers, url });
    return { ok: true, status: 200 };
  });
  assert.deepEqual(result, { enabled: true, ownerId: "166816652" });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /contacts\/batch\/upsert$/);
  assert.equal(calls[0].body.inputs[0].idProperty, "email");
  assert.equal(calls[0].body.inputs[0].properties.hubspot_owner_id, "166816652");
  assert.equal(calls[0].headers.authorization, `Bearer ${environment.HUBSPOT_ACCESS_TOKEN}`);
  assert.match(calls[1].url, /submissions\/v3\/integration\/submit\/246920029\/276bbe5c/);
  assert.equal(calls[1].body.fields.find(({ name }) => name === "program_or_offering").value, "Spiral I — Foundations");
  assert.equal(calls[1].body.fields.some(({ name }) => name === "hubspot_owner_id"), false);
});

test("HubSpot mirror is disabled by default and fails closed when enabled without credentials", async () => {
  assert.deepEqual(await mirrorHubSpotIntake(intake, {}), { enabled: false });
  await assert.rejects(() => mirrorHubSpotIntake(intake, { HUBSPOT_INTAKE_ENABLED: "true" }), /not configured/i);
});

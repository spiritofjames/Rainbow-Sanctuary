import test from "node:test";
import assert from "node:assert/strict";
import { mirrorHubSpotPurchase, toHubSpotPurchaseProperties } from "../api/_lib/hubspot-payment.mjs";

const event = {
  id: "evt_test_payment_123",
  type: "checkout.session.completed",
  created: 1787208000,
  livemode: false,
  data: { object: {
    id: "cs_test_payment_123",
    payment_intent: "pi_test_payment_123",
    payment_status: "paid",
    amount_subtotal: 2200,
    amount_total: 2200,
    currency: "usd",
    customer_details: { email: "participant@example.com", name: "Participant Person" },
    custom_fields: [{ key: "client_display_name", text: { value: "Participant Person" } }],
    metadata: { offer_key: "group-healing", event_id: "group-healing-2026-08-22" }
  } }
};

const environment = {
  HUBSPOT_ACCESS_TOKEN: "pat-na2-synthetic-token-that-is-long-enough",
  HUBSPOT_INTAKE_ENABLED: "true",
  HUBSPOT_OWNER_ID: "166816652",
  HUBSPOT_PORTAL_ID: "246920029"
};

test("verified purchase maps to an Ethel-owned HubSpot customer contact", () => {
  assert.deepEqual(toHubSpotPurchaseProperties(event, "166816652"), {
    area_of_interest: "Group healing",
    email: "participant@example.com",
    enquiry_details: "Payment received for Group Healing — single session. Paid USD 22.00. Reference: cs_test_payment_123. Financial authority: Stripe and the private Rainbow CRM.",
    firstname: "Participant",
    hubspot_owner_id: "166816652",
    lastname: "Person",
    lifecyclestage: "customer",
    program_or_offering: "Online Group Healing"
  });
});

test("a fixed Maintenance commitment is eligible for the payment mirror", () => {
  const maintenancePayment = {
    ...event,
    data: {
      object: {
        ...event.data.object,
        metadata: { offer_key: "regeneration-maintenance-three-month", event_id: "regeneration-maintenance-2026-08-17-three-month" },
        amount_subtotal: 63000,
        amount_total: 63000
      }
    }
  };
  const properties = toHubSpotPurchaseProperties(maintenancePayment, "166816652");
  assert.equal(properties.area_of_interest, "Group healing");
  assert.equal(properties.program_or_offering, "Regeneration Maintenance");
});

test("purchase mirror uses contact upsert and the Stripe event as its write trace", async () => {
  let call;
  const result = await mirrorHubSpotPurchase(event, environment, async (url, options) => {
    call = { body: JSON.parse(options.body), headers: options.headers, url };
    return { json: async () => ({ results: [{ id: "42001" }] }), ok: true, status: 200 };
  });
  assert.deepEqual(result, {
    contactId: "42001",
    contactUrl: "https://app-na2.hubspot.com/contacts/246920029/record/0-1/42001",
    enabled: true,
    fallbackUsed: false,
    ownerId: "166816652"
  });
  assert.match(call.url, /contacts\/batch\/upsert$/);
  assert.equal(call.body.inputs[0].id, "participant@example.com");
  assert.equal(call.body.inputs[0].objectWriteTraceId, event.id);
  assert.equal(call.body.inputs[0].properties.lifecyclestage, "customer");
});

test("a Stripe promotion is accepted when the approved subtotal remains intact", () => {
  const promotedMaintenancePayment = {
    ...event,
    data: { object: {
      ...event.data.object,
      amount_subtotal: 21000,
      amount_total: 100,
      metadata: { offer_key: "regeneration-maintenance-monthly", event_id: "regeneration-maintenance-2026-08-17-monthly" }
    } }
  };
  const properties = toHubSpotPurchaseProperties(promotedMaintenancePayment, "166816652");
  assert.match(properties.enquiry_details, /Paid USD 1\.00/);
  assert.equal(properties.program_or_offering, "Regeneration Maintenance");
});

test("a partial HubSpot response falls back to core contact fields", async () => {
  const calls = [];
  const result = await mirrorHubSpotPurchase(event, environment, async (_url, options) => {
    calls.push(JSON.parse(options.body));
    if (calls.length === 1) return { json: async () => ({ errors: [{ message: "custom field unavailable" }] }), ok: true, status: 207 };
    return { json: async () => ({ results: [{ id: "42002" }] }), ok: true, status: 200 };
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].inputs[0].objectWriteTraceId, "evt_test_payment_123-core-contact");
  assert.deepEqual(Object.keys(calls[1].inputs[0].properties).sort(), ["email", "firstname", "hubspot_owner_id", "lastname", "lifecyclestage"]);
  assert.equal(result.contactId, "42002");
  assert.equal(result.fallbackUsed, true);
});

test("payment mirror fails closed for catalogue mismatches or missing configuration", async () => {
  assert.throws(() => toHubSpotPurchaseProperties({
    ...event,
    data: { object: { ...event.data.object, amount_subtotal: 2201, amount_total: 2201 } }
  }, "166816652"), /approved catalogue/i);
  await assert.rejects(
    () => mirrorHubSpotPurchase(event, { HUBSPOT_INTAKE_ENABLED: "true" }),
    /not configured/i
  );
});

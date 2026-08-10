import test from "node:test";
import assert from "node:assert/strict";
import { emailCatalog } from "../emails/catalog.mjs";
import {
  assertEmailDelivery,
  assertOperationalEmailDelivery,
  sendOperationalEmail,
  sendTransactionalEmail
} from "../api/_lib/email-service.mjs";

const template = emailCatalog.find(({ alias }) => alias === "rs-enquiry-received");
const variables = Object.fromEntries(template.variables.map(({ key }) => [key, `Value for ${key}`]));

test("email remains disabled by default", () => {
  assert.equal(assertEmailDelivery({ alias: template.alias, to: "person@example.com", variables }, {}).deliver, false);
});

test("Preview delivery is restricted to an explicit recipient allowlist", () => {
  const environment = {
    RESEND_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    VERCEL_ENV: "preview",
    RESEND_ALLOWED_RECIPIENTS: "reviewer@example.com"
  };
  assert.throws(
    () => assertEmailDelivery({ alias: template.alias, to: "another@example.com", variables }, environment),
    /staging allowlist/
  );
  assert.equal(assertEmailDelivery({ alias: template.alias, to: "reviewer@example.com", variables }, environment).deliver, true);
});

test("Production delivery requires a separate explicit approval", () => {
  assert.throws(
    () => assertEmailDelivery({ alias: template.alias, to: "person@example.com", variables }, {
      RESEND_EMAIL_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      VERCEL_ENV: "production"
    }),
    /not been explicitly approved/
  );
});

test("send uses the server-owned template identity and stable idempotency key", async () => {
  let call;
  const client = { emails: { send: async (...args) => { call = args; return { data: { id: "email_123" }, error: null }; } } };
  const result = await sendTransactionalEmail({
    alias: template.alias,
    to: "reviewer@example.com",
    variables,
    idempotencyKey: "enquiry:RS-2026-0042:received"
  }, {
    RESEND_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    VERCEL_ENV: "preview",
    RESEND_ALLOWED_RECIPIENTS: "reviewer@example.com"
  }, client);
  assert.deepEqual(result, { sent: true, id: "email_123" });
  assert.equal(call[0].template.id, template.alias);
  assert.equal(call[0].from, template.from);
  assert.equal(call[0].replyTo, template.replyTo);
  assert.equal(call[1].idempotencyKey, "enquiry:RS-2026-0042:received");
});

test("all required template variables must be populated", () => {
  assert.throws(
    () => assertEmailDelivery({ alias: template.alias, to: "reviewer@example.com", variables: {} }, {
      RESEND_EMAIL_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      VERCEL_ENV: "preview",
      RESEND_ALLOWED_RECIPIENTS: "reviewer@example.com"
    }),
    /Missing transactional email variables/
  );
});

test("operational email uses a fixed Rainbow identity, allowlisted recipient and idempotency key", async () => {
  let call;
  const client = { emails: { send: async (...args) => { call = args; return { data: { id: "email_ops_123" }, error: null }; } } };
  const environment = {
    RESEND_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    RESEND_ALLOWED_RECIPIENTS: "ethel@rainbowsanctuary.life",
    VERCEL_ENV: "preview"
  };
  assert.equal(assertOperationalEmailDelivery({
    identity: "general",
    to: "ethel@rainbowsanctuary.life"
  }, environment).deliver, true);
  await assert.rejects(
    () => sendOperationalEmail({
      html: "<p>Test</p>",
      identity: "unknown",
      idempotencyKey: "ops:test",
      subject: "Test",
      text: "Test",
      to: "ethel@rainbowsanctuary.life"
    }, environment, client),
    /unknown operational email identity/i
  );
  const result = await sendOperationalEmail({
    html: "<p>Test</p>",
    identity: "general",
    idempotencyKey: "intake:event-123:operations",
    subject: "New enquiry",
    tags: [{ name: "workflow", value: "enquiry" }],
    text: "Test",
    to: "ethel@rainbowsanctuary.life"
  }, environment, client);
  assert.deepEqual(result, { sent: true, id: "email_ops_123" });
  assert.equal(call[0].from, "Rainbow Sanctuary <hello@rainbowsanctuary.life>");
  assert.equal(call[0].to[0], "ethel@rainbowsanctuary.life");
  assert.equal(call[1].idempotencyKey, "intake:event-123:operations");
});

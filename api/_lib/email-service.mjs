import { Resend } from "resend";
import { emailByAlias } from "../../emails/catalog.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPERATIONAL_IDENTITIES = Object.freeze({
  bookings: {
    from: "Rainbow Sanctuary Bookings <bookings@rainbowsanctuary.life>",
    replyTo: "bookings@rainbowsanctuary.life"
  },
  general: {
    from: "Rainbow Sanctuary <hello@rainbowsanctuary.life>",
    replyTo: "hello@rainbowsanctuary.life"
  }
});

function booleanValue(value) {
  return String(value || "").toLowerCase() === "true";
}

function allowedRecipients(environment) {
  return new Set(
    String(environment.RESEND_ALLOWED_RECIPIENTS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function emailDeliveryPolicy(environment = process.env) {
  const enabled = booleanValue(environment.RESEND_EMAIL_ENABLED);
  const production = environment.VERCEL_ENV === "production";
  const productionApproved = booleanValue(environment.RESEND_PRODUCTION_APPROVED);
  const recipients = allowedRecipients(environment);

  return {
    enabled,
    production,
    productionApproved,
    recipients,
    configured: Boolean(environment.RESEND_API_KEY)
  };
}

export function assertEmailDelivery({ alias, to, variables }, environment = process.env) {
  const template = emailByAlias.get(alias);
  if (!template) throw new Error("Unknown transactional email template.");
  if (!EMAIL_PATTERN.test(String(to || ""))) throw new Error("A valid recipient is required.");

  const policy = emailDeliveryPolicy(environment);
  if (!policy.enabled) return { deliver: false, reason: "disabled", template };
  if (!policy.configured) throw new Error("Transactional email is enabled but no Resend key is configured.");
  if (policy.production && !policy.productionApproved) {
    throw new Error("Production transactional email has not been explicitly approved.");
  }
  if (!policy.production && !policy.recipients.has(String(to).toLowerCase())) {
    throw new Error("Preview email recipient is not on the staging allowlist.");
  }

  const missing = template.variables
    .map(({ key }) => key)
    .filter((key) => typeof variables?.[key] !== "string" || variables[key].trim() === "");
  if (missing.length) throw new Error(`Missing transactional email variables: ${missing.join(", ")}.`);
  return { deliver: true, reason: null, template };
}

export function assertOperationalEmailDelivery({ identity, to }, environment = process.env) {
  const sender = OPERATIONAL_IDENTITIES[identity];
  if (!sender) throw new Error("Unknown operational email identity.");
  if (!EMAIL_PATTERN.test(String(to || ""))) throw new Error("A valid operational recipient is required.");

  const policy = emailDeliveryPolicy(environment);
  if (!policy.enabled) return { deliver: false, reason: "disabled", sender };
  if (!policy.configured) throw new Error("Transactional email is enabled but no Resend key is configured.");
  if (policy.production && !policy.productionApproved) {
    throw new Error("Production transactional email has not been explicitly approved.");
  }
  if (!policy.production && !policy.recipients.has(String(to).toLowerCase())) {
    throw new Error("Operational recipient is not on the staging allowlist.");
  }
  return { deliver: true, reason: null, sender };
}

export async function sendTransactionalEmail(
  { alias, to, variables, idempotencyKey, tags = [] },
  environment = process.env,
  resendClient
) {
  const policy = assertEmailDelivery({ alias, to, variables }, environment);
  if (!policy.deliver) return { sent: false, reason: policy.reason };
  if (!idempotencyKey || idempotencyKey.length > 256) {
    throw new Error("A stable Resend idempotency key is required.");
  }

  const resend = resendClient || new Resend(environment.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    {
      from: policy.template.from,
      replyTo: policy.template.replyTo,
      to: [to],
      template: {
        id: policy.template.alias,
        variables
      },
      tags: [
        { name: "system", value: "rainbow-sanctuary" },
        { name: "template", value: policy.template.alias.replaceAll("-", "_") },
        ...tags
      ]
    },
    { idempotencyKey }
  );
  if (error) throw new Error(`Resend delivery failed: ${error.message}`);
  return { sent: true, id: data.id };
}

export async function sendOperationalEmail(
  { html, identity, idempotencyKey, subject, tags = [], text, to },
  environment = process.env,
  resendClient
) {
  const policy = assertOperationalEmailDelivery({ identity, to }, environment);
  if (!policy.deliver) return { sent: false, reason: policy.reason };
  if (!idempotencyKey || idempotencyKey.length > 256) {
    throw new Error("A stable Resend idempotency key is required.");
  }
  if (![html, subject, text].every((value) => typeof value === "string" && value.trim())) {
    throw new Error("Operational email content is required.");
  }

  const resend = resendClient || new Resend(environment.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    {
      from: policy.sender.from,
      replyTo: policy.sender.replyTo,
      to: [to],
      subject,
      html,
      text,
      tags: [
        { name: "system", value: "rainbow-sanctuary" },
        { name: "message_type", value: "operations" },
        ...tags
      ]
    },
    { idempotencyKey }
  );
  if (error) throw new Error(`Resend delivery failed: ${error.message}`);
  return { sent: true, id: data.id };
}

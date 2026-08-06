import { Resend } from "resend";
import { emailCatalog } from "../emails/catalog.mjs";
import { automationCatalog, automationDefinition } from "../emails/automations.mjs";

if (!process.env.RESEND_SETUP_API_KEY) {
  throw new Error("RESEND_SETUP_API_KEY is required. Use a short-lived Full Access key and revoke it after this command.");
}

const resend = new Resend(process.env.RESEND_SETUP_API_KEY);

async function unwrap(promise, action) {
  const result = await promise;
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data;
}

const existingTemplates = await unwrap(resend.templates.list({ limit: 100 }), "List templates");
const templateIds = new Map(existingTemplates.data.map(({ alias, id }) => [alias, id]));

for (const template of emailCatalog) {
  const payload = {
    name: template.name,
    alias: template.alias,
    from: template.from,
    replyTo: template.replyTo,
    subject: template.subject,
    html: template.html,
    text: template.text,
    variables: template.variables
  };
  let id = templateIds.get(template.alias);
  if (id) {
    await unwrap(resend.templates.update(id, payload), `Update ${template.alias}`);
  } else {
    const created = await unwrap(resend.templates.create(payload), `Create ${template.alias}`);
    id = created.id;
    templateIds.set(template.alias, id);
  }
  await unwrap(resend.templates.publish(id), `Publish ${template.alias}`);
  console.log(`published template ${template.alias}`);
}

const existingAutomations = await unwrap(resend.automations.list({ limit: 100 }), "List automations");
const automationIds = new Map(existingAutomations.data.map(({ name, id }) => [name, id]));

for (const automation of automationCatalog) {
  const templateId = templateIds.get(automation.templateAlias);
  const definition = automationDefinition(automation, templateId);
  const existingId = automationIds.get(automation.name);
  if (existingId) {
    await unwrap(resend.automations.update(existingId, definition), `Update ${automation.event}`);
  } else {
    await unwrap(resend.automations.create(definition), `Create ${automation.event}`);
  }
  console.log(`synced disabled automation ${automation.event}`);
}

console.log(`Resend sync complete: ${emailCatalog.length} published templates, ${automationCatalog.length} disabled automations.`);

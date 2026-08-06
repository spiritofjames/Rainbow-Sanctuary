import { emailCatalog } from "./catalog.mjs";

/**
 * Resend event payload contract:
 * {
 *   email: "participant@example.com",
 *   ...template variables using the exact uppercase keys below
 * }
 *
 * Every workflow is provisioned disabled. Operations enables an automation only
 * after its producer (website or CRM) has passed staging acceptance.
 */
export const automationCatalog = emailCatalog.map((template) => ({
  name: `RS · ${template.event}`,
  event: template.event,
  templateAlias: template.alias,
  status: "disabled",
  requiredFields: ["email", ...template.variables.map(({ key }) => key)]
}));

export function automationDefinition(automation, templateId) {
  const variables = Object.fromEntries(
    automation.requiredFields
      .filter((field) => field !== "email")
      .map((field) => [field, { var: field }])
  );

  return {
    name: automation.name,
    status: automation.status,
    steps: [
      {
        key: "trigger",
        type: "trigger",
        config: { eventName: automation.event }
      },
      {
        key: "send",
        type: "send_email",
        config: {
          template: { id: templateId, variables }
        }
      }
    ],
    connections: [{ from: "trigger", to: "send", type: "default" }]
  };
}

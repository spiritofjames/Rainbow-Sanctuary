import assert from "node:assert/strict";
import { emailCatalog } from "../emails/catalog.mjs";
import { automationCatalog } from "../emails/automations.mjs";

assert.ok(emailCatalog.length >= 20, "The lifecycle catalog is unexpectedly incomplete.");
assert.equal(new Set(emailCatalog.map(({ alias }) => alias)).size, emailCatalog.length, "Template aliases must be unique.");
assert.equal(new Set(emailCatalog.map(({ event }) => event)).size, emailCatalog.length, "Event names must be unique.");
assert.equal(automationCatalog.length, emailCatalog.length, "Every template must have an automation contract.");

for (const template of emailCatalog) {
  assert.match(template.alias, /^rs-[a-z0-9-]+$/);
  assert.match(template.event, /^rs\.[a-z0-9_.]+$/);
  assert.match(template.from, /@rainbowsanctuary\.life>$/);
  assert.match(template.replyTo, /@rainbowsanctuary\.life$/);
  assert.ok(template.subject.length > 5);
  assert.match(template.html, /<!doctype html>/i);
  assert.ok(template.text.length > 80);
  assert.doesNotMatch(template.html, /<img\b/i, "Email templates must not depend on remote images.");
  assert.doesNotMatch(`${template.subject} ${template.html}`, /unsubscribe|newsletter|marketing campaign/i);
  for (const { key } of template.variables) {
    assert.ok(template.html.includes(`{{{${key}}}}`), `${template.alias} does not use ${key} in HTML.`);
    assert.ok(template.text.includes(`{{{${key}}}}`), `${template.alias} does not use ${key} in text.`);
  }
}

console.log(`Validated ${emailCatalog.length} templates and ${automationCatalog.length} disabled automation contracts.`);

import { writeFile } from "node:fs/promises";
import { emailCatalog } from "../emails/catalog.mjs";

const sampleValues = {
  NAME: "Maya",
  ENQUIRY_TOPIC: "Group healing",
  REFERENCE_ID: "RS-2026-0042",
  PATHWAY: "Private Healing Journey",
  EVENT_TITLE: "Group Healing: Returning to Wholeness",
  EVENT_DATE: "18 August 2026",
  EVENT_TIME: "21:00",
  TIMEZONE: "Asia/Makassar (WITA)",
  LOCATION: "Online · private link",
  CALENDAR_URL: "https://rainbowsanctuary.life/events",
  ACCESS_URL: "https://rainbowsanctuary.life/events",
  SESSION_TITLE: "Listening inward",
  PROGRAM_NAME: "Spiral Journey"
};

function fill(content) {
  return content.replace(/\{\{\{([A-Z0-9_]+)\}\}\}/g, (_, key) => sampleValues[key] || `[${key.toLowerCase().replaceAll("_", " ")}]`);
}

const cards = emailCatalog.map((template) => `
  <section id="${template.alias}">
    <header><strong>${template.name}</strong><code>${template.event}</code></header>
    <iframe title="${template.name}" srcdoc="${fill(template.html).replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"></iframe>
  </section>`).join("");

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rainbow Sanctuary email system preview</title><style>body{margin:0;background:#171717;color:#fafafa;font:15px Arial,sans-serif}nav{position:sticky;top:0;z-index:2;padding:16px 24px;background:#171717;border-bottom:1px solid #383838}nav p{margin:4px 0;color:#aaa}main{display:grid;gap:28px;padding:28px}section{background:#242424;border:1px solid #3f3f3f;border-radius:18px;overflow:hidden}header{display:flex;justify-content:space-between;gap:16px;padding:15px 18px}code{color:#b8afff}iframe{display:block;width:100%;height:820px;border:0;background:#f5f5f5}@media(max-width:700px){header{display:block}code{display:block;margin-top:7px}main{padding:12px}}</style></head><body><nav><strong>Rainbow Sanctuary · transactional email system</strong><p>${emailCatalog.length} templates · local preview only · no messages are sent</p></nav><main>${cards}</main></body></html>`;

await writeFile(new URL("../emails/preview.html", import.meta.url), page);
console.log(`Built emails/preview.html with ${emailCatalog.length} templates.`);

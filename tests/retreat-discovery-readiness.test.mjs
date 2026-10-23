import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const page = read("Awakening-Your-Inner-Light-2026.dc.html");
const graphs = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])["@graph"] || []);
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

test("December FAQ text and structured data come from the same source without JavaScript", () => {
  const faqs = JSON.parse(read("data/december-retreat-faqs.json"));
  const schema = graphs(page).filter(item => item["@type"] === "FAQPage");
  assert.equal(schema.length, 1);
  assert.equal(schema[0].mainEntity.length, faqs.length);
  assert.equal((page.match(/id="frequently-asked-questions"/g) || []).length, 1);
  assert.doesNotMatch(page, /data-rs-faq-slot/);
  faqs.forEach(({question,answer}, index) => {
    assert.ok(page.includes(`<summary>${escape(question)}</summary><p>${escape(answer)}</p>`));
    assert.equal(schema[0].mainEntity[index].name, question);
    assert.equal(schema[0].mainEntity[index].acceptedAnswer.text, answer);
  });
});

test("event metadata is consistent and does not invent availability, venue or completed enum", () => {
  const event = graphs(page).find(item => item["@type"] === "Event");
  assert.equal(event.startDate, "2026-12-03");
  assert.equal(event.endDate, "2026-12-09");
  assert.equal(event.offers.price, "3500");
  assert.equal(event.offers.priceCurrency, "USD");
  assert.equal(event.offers.availability, undefined);
  assert.equal(event.location, undefined, "do not fabricate an unconfirmed December venue");
  const archive = graphs(read("Awakening-Your-Inner-Light-October-2026.dc.html")).find(item => item["@type"] === "Event");
  assert.equal(archive.startDate, "2026-10-01");
  assert.equal(archive.endDate, "2026-10-07");
  assert.equal(archive.eventStatus, undefined);
  assert.equal(archive.offers, undefined);
});

test("staging is noindex without changing production metadata or security headers", () => {
  const config = JSON.parse(read("vercel.json"));
  const staging = config.headers.find(rule => rule.has?.some(condition => condition.type === "host" && condition.value === "staging.rainbowsanctuary.life"));
  assert.match(staging.headers.find(h => h.key === "X-Robots-Tag").value, /noindex/);
  assert.ok(config.headers.find(rule => rule.source === "/(.*)" && !rule.has).headers.some(h => h.key === "Content-Security-Policy"));
  assert.match(page, /name="robots" content="index,follow/);
  assert.match(read("robots.txt"), /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(read("sitemap.xml"), /awakening-your-inner-light-2026<\/loc><lastmod>2026-10-22<\/lastmod>/);
  assert.match(page, /og:image:width" content="1920"/);
  assert.match(page, /og:image:height" content="1079"/);
  assert.match(page, /intent=discovery-call/);
});

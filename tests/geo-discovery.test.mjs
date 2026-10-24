import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import privateSource from "../api/private-source.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const config = JSON.parse(read("vercel.json"));
const graphs = (file) => [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])["@graph"] || []);

test("only indexable canonical pages receive faithful Markdown alternates", () => {
  const urls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, 58);
  for (const url of urls) {
    const route = new URL(url).pathname;
    const source = config.rewrites.find(r => r.source === route).destination.slice(1);
    const path = `/markdown/${route === "/" ? "home" : route.slice(1)}.md`;
    assert.ok(read(source).includes(`rel="alternate" type="text/markdown" href="https://rainbowsanctuary.life${path}"`));
    const markdown = read(path.slice(1));
    assert.ok(markdown.startsWith(`Source: ${url}\n`));
    assert.match(markdown, /^# /m);
    assert.doesNotMatch(markdown, /<script|<form|source_ids:|consent_record:|\{\{[^}]+\}\}/i);
    const headers = config.headers.find(r => r.source === path).headers;
    assert.equal(headers.find(h => h.key === "Content-Type").value, "text/markdown; charset=utf-8");
    assert.ok(headers.find(h => h.key === "Link").value.includes(`<${url}>; rel="canonical"`));
  }
  assert.equal(existsSync(`${root}markdown/knowledge/search.md`), false);
  assert.equal(existsSync(`${root}markdown/young-people-wellbeing.md`), false);
  assert.equal(existsSync(`${root}markdown/payment-confirmation.md`), false);
  assert.match(read("llms.txt"), /Public Markdown directory/);
  const retreat = read("markdown/awakening-your-inner-light-2026.md");
  assert.match(retreat, /3–9 December 2026/);
  assert.match(retreat, /3,500/);
  for (const {question, answer} of JSON.parse(read("data/december-retreat-faqs.json"))) {
    assert.ok(retreat.includes(question));
    assert.ok(retreat.includes(answer));
  }
});

test("generated search stays noindex and retired event data is absent", () => {
  assert.match(read("Knowledge-Search.dc.html"), /name="robots" content="noindex,follow/);
  assert.doesNotMatch(read("sitemap.xml"), /\/knowledge\/search<\/loc>/);
  assert.equal(graphs("Online-Group-Healing.dc.html").some(n => n["@type"] === "Event"), false);
  assert.doesNotMatch(read("Online-Group-Healing.dc.html"), /event-2026-08-18/);
  assert.doesNotMatch(read("Online-Group-Healing.dc.html") + read("Home.dc.html"), /twice[ -]monthly/i);
  assert.match(read("llms-full.txt"), /4-Day Foundation/);
  assert.match(read("llms-full.txt"), /separate adult professional pathway/);
});

test("final article schema preserves organizational authors and breadcrumbs", () => {
  const entries = JSON.parse(read("knowledge-build-manifest.json")).entries;
  for (const entry of entries) {
    const route = new URL(entry.canonicalUrl).pathname;
    const source = config.rewrites.find(r => r.source === route).destination.slice(1);
    const graph = graphs(source);
    const article = graph.find(n => n["@type"] === "Article");
    for (const role of ["author", "reviewer"]) {
      if (entry[role].id === "rainbow-editorial") assert.equal(article[role === "reviewer" ? "reviewedBy" : role]["@type"], "Organization");
    }
    assert.equal(graph.filter(n => n["@type"] === "BreadcrumbList").length, 1);
  }
});

test("repository-only paths are denied with a real 404, not just robots exclusion", () => {
  for (const dir of ["content", "docs", "tests", "scripts", "output"]) {
    assert.equal(config.rewrites.find(r => r.source === `/${dir}/:path*`).destination, "/api/private-source");
  }
  const result = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, end(body) { this.body = body; } };
  privateSource({}, result);
  assert.equal(result.statusCode, 404);
  assert.equal(result.body, "Not found\n");
  assert.equal(result.headers["Cache-Control"], "no-store");
});

test("discovery generation precedes validation", () => {
  const command = JSON.parse(read("package.json")).scripts["quality:preflight"];
  assert.ok(command.indexOf("publish-discovery-layer") < command.indexOf("npm test"));
});

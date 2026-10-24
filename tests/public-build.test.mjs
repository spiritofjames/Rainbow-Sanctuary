import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicSite } from "../scripts/build-public-site.mjs";

test("public build excludes source and preserves page assets, search and CMS", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "rainbow-public-build-"));
  const files = ["Home.dc.html", "site.css", "support.js", "robots.txt", "knowledge-index.json",
    "assets/photo.jpg", "pagefind/pagefind.js", "markdown/home.md", "guardian/config.yml", "review/index.html",
    "content/knowledge/draft.md", "docs/audit.md", "tests/private.test.mjs", "scripts/tool.js", "output/evidence.html",
    "api/crm/intake.mjs", "emails/catalog.mjs", "package.json", "AGENTS.md", ".env", "knowledge-build-manifest.json",
    "internal-tool.js", "Unpublished.dc.html", "guardian/private-notes.md"];
  try {
    writeFileSync(path.join(dir, "vercel.json"), JSON.stringify({ rewrites: [{ destination: "/Home.dc.html" }] }));
    for (const file of files) {
      mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      writeFileSync(path.join(dir, file), file);
    }
    let result = buildPublicSite(dir);
    assert.deepEqual(result.files.sort(), files.slice(0, 10).sort());
    for (const file of files.slice(10)) assert.equal(existsSync(path.join(result.output, file)), false, file);
    writeFileSync(path.join(result.output, "stale.html"), "old");
    result = buildPublicSite(dir);
    assert.equal(existsSync(path.join(result.output, "stale.html")), false);
    assert.equal(existsSync(path.join(dir, "api/crm/intake.mjs")), true);
    assert.equal(existsSync(path.join(dir, "content/knowledge/draft.md")), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("public build rejects source symlinks and unrecognized output", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "rainbow-public-build-"));
  try {
    writeFileSync(path.join(dir, "vercel.json"), JSON.stringify({ rewrites: [] }));
    mkdirSync(path.join(dir, "public-build"));
    writeFileSync(path.join(dir, "public-build/notes.txt"), "preserve");
    assert.throws(() => buildPublicSite(dir), /unrecognized/);
    assert.equal(readFileSync(path.join(dir, "public-build/notes.txt"), "utf8"), "preserve");
    rmSync(path.join(dir, "public-build"), { recursive: true });
    symlinkSync(path.join(dir, ".env"), path.join(dir, "support.js"));
    assert.throws(() => buildPublicSite(dir), /symlinks/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("Vercel publishes only packaged static output and retains native functions", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const config = JSON.parse(readFileSync(path.join(root, "vercel.json")));
  assert.equal(config.outputDirectory, "public-build");
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.builds, undefined);
  assert.ok(existsSync(path.join(root, "api/crm/intake.mjs")));
  const scripts = JSON.parse(readFileSync(path.join(root, "package.json"))).scripts;
  assert.match(scripts.build, /quality:preflight/);
  assert.match(scripts["quality:preflight"], /build-public-site/);
});

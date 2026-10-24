import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { reconcileMarkdown } from "../scripts/lib/reconcile-markdown.mjs";

test("unpublishing removes old generated Markdown without deleting unknown work", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rainbow-markdown-test-"));
  try {
    fs.mkdirSync(path.join(dir, "knowledge"));
    fs.writeFileSync(path.join(dir, "home.md"), "Source: https://rainbowsanctuary.life/\n\n# Home\n");
    fs.writeFileSync(path.join(dir, "knowledge/retired.md"), "Source: https://rainbowsanctuary.life/knowledge/retired\n\n# Retired\n");
    reconcileMarkdown(dir, ["home.md"]);
    assert.ok(fs.existsSync(path.join(dir, "home.md")));
    assert.ok(!fs.existsSync(path.join(dir, "knowledge/retired.md")));
    fs.writeFileSync(path.join(dir, "notes.md"), "User-authored work\n");
    assert.throws(() => reconcileMarkdown(dir, ["home.md"]), /Unrecognized file/);
    assert.ok(fs.existsSync(path.join(dir, "notes.md")));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

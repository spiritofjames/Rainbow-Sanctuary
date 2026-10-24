import fs from "node:fs";
import path from "node:path";

// Remove only recognizable generated mirrors when a route is unpublished.
// Unknown files are a build error, not a license to delete user-authored work.
export function reconcileMarkdown(directory, expectedPaths) {
  if (!fs.existsSync(directory)) return;
  const expected = new Set(expectedPaths.map(p => p.replaceAll("\\", "/")));
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Symlinks are not allowed in generated Markdown.");
      if (entry.isDirectory()) { visit(file); continue; }
      const relative = path.relative(directory, file).split(path.sep).join("/");
      if (expected.has(relative)) continue;
      if (!entry.isFile() || !relative.endsWith(".md") ||
        !/^Source: https:\/\/rainbowsanctuary\.life\/[^\n]*\n/.test(fs.readFileSync(file, "utf8"))) {
        throw new Error(`Unrecognized file in generated Markdown directory: ${relative}`);
      }
      fs.unlinkSync(file);
    }
  }
  visit(directory);
}

import { spawnSync } from "node:child_process";
import { createHash, createHmac } from "node:crypto";

const ENDPOINT = "https://psn-relationship-hub.vercel.app/api/intake/knowledge-decision";

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error("Unable to prepare knowledge decision metadata.");
  return result.stdout.trim();
}

function deterministicUuid(value) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest("hex").slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const repository = process.env.GITHUB_REPOSITORY ?? "spiritofjames/Rainbow-Sanctuary";
const revision = process.env.GITHUB_SHA ?? git(["rev-parse", "HEAD"]);
const branch = process.env.GITHUB_REF_NAME ?? git(["branch", "--show-current"]);
const sourceEnvironment = branch === "main" ? "production" : branch === "staging" ? "staging" : "local";
const title = git(["log", "-1", "--pretty=%s", revision]);
const detail = git(["log", "-1", "--pretty=%B", revision]);
const occurredAt = git(["log", "-1", "--pretty=%cI", revision]);
const changedPaths = git([
  "diff-tree",
  "--first-parent",
  "--no-commit-id",
  "--name-only",
  "-r",
  revision,
])
  .split("\n")
  .map((path) => path.trim())
  .filter(Boolean)
  .slice(0, 100);
const secret = process.env.PSN_KNOWLEDGE_INTAKE_SIGNING_KEY ?? "";

if (repository !== "spiritofjames/Rainbow-Sanctuary" || secret.length < 32) {
  throw new Error("Knowledge decision signing configuration is required.");
}

const payload = {
  audience: "internal",
  authority: "release-metadata",
  branch,
  changedPaths,
  detail,
  environment: sourceEnvironment,
  eventId: deterministicUuid(`${repository}:${revision}:${sourceEnvironment}`),
  occurredAt,
  repository,
  revision,
  schemaVersion: "psn.knowledge-decision.v1",
  source: "website-release",
  title,
};
const raw = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1_000);
const signature = createHmac("sha256", secret)
  .update(`${timestamp}.${raw}`)
  .digest("hex");
const response = await fetch(ENDPOINT, {
  body: raw,
  headers: {
    "Content-Type": "application/json",
    "X-PSN-Knowledge-Signature": `t=${timestamp},v1=${signature}`,
  },
  method: "POST",
  signal: AbortSignal.timeout(40_000),
});
const result = await response.json().catch(() => ({}));
if (!response.ok || result.accepted !== true || result.decisionId !== payload.eventId) {
  throw new Error(`Knowledge decision intake failed with HTTP ${response.status}.`);
}
process.stdout.write(
  `Knowledge decision ${result.replayed ? "replayed" : "captured"}; summary ${result.summaryState}.\n`,
);

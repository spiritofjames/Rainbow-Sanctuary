export function groupHealingZoomJoinUrl(environment = process.env) {
  const value = String(environment.GROUP_HEALING_ZOOM_JOIN_URL || "").trim();
  if (!value) throw new Error("Group Healing Zoom access is not configured.");

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Group Healing Zoom access is invalid.");
  }

  if (parsed.protocol !== "https:" || !(parsed.hostname === "zoom.us" || parsed.hostname.endsWith(".zoom.us"))) {
    throw new Error("Group Healing Zoom access must be a secure Zoom link.");
  }

  return parsed.toString();
}

const colors = {
  canvas: "#f5f5f5",
  card: "#ffffff",
  ink: "#0c0a09",
  body: "#4e4e4e",
  muted: "#6f6962",
  hairline: "#e7e5e4",
  violet: "#5748e8",
  green: "#315f55",
  lavender: "#eeeafd"
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function variable(name) {
  return `{{{${name}}}}`;
}

function detailsTable(details = []) {
  if (!details.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid ${colors.hairline};border-radius:14px;background:${colors.canvas};border-collapse:separate;overflow:hidden">${details.map(({ label, value }) => `<tr><td style="padding:10px 14px;border-bottom:1px solid ${colors.hairline};color:${colors.muted};font-family:Arial,sans-serif;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.7px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 14px;border-bottom:1px solid ${colors.hairline};color:${colors.ink};font-family:Arial,sans-serif;font-size:14px;line-height:20px;text-align:right;vertical-align:top">${value}</td></tr>`).join("")}</table>`;
}

function calloutBlock(callout) {
  if (!callout) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-left:3px solid ${colors.green};background:#f2f7f5;border-collapse:separate"><tr><td style="padding:16px 18px;color:${colors.body};font-family:Arial,sans-serif;font-size:14px;line-height:22px">${callout}</td></tr></table>`;
}

function buttonBlock(cta) {
  if (!cta) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr><td style="border-radius:999px;background:${colors.violet}"><a href="${cta.url}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;line-height:20px;text-decoration:none">${escapeHtml(cta.label)} &nbsp;→</a></td></tr></table>`;
}

function secondaryButtonBlock(cta) {
  if (!cta) return "";
  return `<p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:14px;line-height:20px"><a href="${cta.url}" style="color:${colors.green};font-weight:600">${escapeHtml(cta.label)} →</a></p>`;
}

export function emailHtml({ preheader, eyebrow, heading, greeting, paragraphs, details, callout, cta, secondaryCta, closing = "With care,<br>Rainbow Sanctuary" }) {
  const content = paragraphs.map((paragraph) => `<p style="margin:0 0 16px;color:${colors.body};font-family:Arial,sans-serif;font-size:16px;line-height:26px">${paragraph}</p>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${colors.canvas};word-spacing:normal">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${colors.canvas};border-collapse:collapse"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${colors.card};border:1px solid ${colors.hairline};border-radius:20px;border-collapse:separate;overflow:hidden">
    <tr><td style="height:6px;background:linear-gradient(90deg,${colors.green},${colors.violet},#c8b8e0);font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:28px 36px 24px;border-bottom:1px solid ${colors.hairline}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,'Times New Roman',serif;color:${colors.ink};font-size:24px;line-height:30px">Rainbow Sanctuary</td><td align="right"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colors.violet}">&nbsp;</span></td></tr></table>
      <p style="margin:7px 0 0;color:${colors.muted};font-family:Arial,sans-serif;font-size:12px;line-height:18px;letter-spacing:.7px;text-transform:uppercase">Healing · Growth · Conscious community</p>
    </td></tr>
    <tr><td style="padding:36px">
      <p style="margin:0 0 12px;color:${colors.green};font-family:Arial,sans-serif;font-size:12px;font-weight:700;line-height:18px;letter-spacing:1px;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0 0 22px;color:${colors.ink};font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;line-height:40px">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 16px;color:${colors.ink};font-family:Arial,sans-serif;font-size:16px;line-height:26px">${greeting}</p>
      ${content}${detailsTable(details)}${calloutBlock(callout)}${buttonBlock(cta)}${secondaryButtonBlock(secondaryCta)}
      <p style="margin:28px 0 0;color:${colors.body};font-family:Arial,sans-serif;font-size:15px;line-height:24px">${closing}</p>
    </td></tr>
    <tr><td style="padding:24px 36px;background:#fafafa;border-top:1px solid ${colors.hairline}">
      <p style="margin:0 0 8px;color:${colors.muted};font-family:Arial,sans-serif;font-size:12px;line-height:19px">This is a service message connected to an enquiry, application, booking or program relationship with Rainbow Sanctuary.</p>
      <p style="margin:0;color:${colors.muted};font-family:Arial,sans-serif;font-size:12px;line-height:19px"><a href="https://rainbowsanctuary.life/privacy-policy" style="color:${colors.green}">Privacy</a> &nbsp;·&nbsp; <a href="mailto:support@rainbowsanctuary.life" style="color:${colors.green}">Support</a> &nbsp;·&nbsp; <a href="https://rainbowsanctuary.life" style="color:${colors.green}">rainbowsanctuary.life</a></p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export function emailText({ eyebrow, heading, greeting, paragraphs, details = [], callout, cta, secondaryCta, closing = "With care,\nRainbow Sanctuary" }) {
  const detailText = details.length ? `\n${details.map(({ label, value }) => `${label}: ${value}`).join("\n")}\n` : "";
  const ctaText = cta ? `\n${cta.label}: ${cta.url}\n` : "";
  const secondaryCtaText = secondaryCta ? `\n${secondaryCta.label}: ${secondaryCta.url}\n` : "";
  return `${eyebrow}\n${heading}\n\n${greeting}\n\n${paragraphs.join("\n\n")}${detailText}${callout ? `\n${callout}\n` : ""}${ctaText}${secondaryCtaText}\n${closing}\n\nPrivacy: https://rainbowsanctuary.life/privacy-policy\nSupport: support@rainbowsanctuary.life`;
}

export const brandColors = colors;

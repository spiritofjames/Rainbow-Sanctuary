import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { OFFER_CATALOG } from "../api/_lib/offer-catalog.mjs";
import { paymentInviteSignature } from "../api/_lib/payment-invite.mjs";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function formatMoney(amountMinor, currency) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0
  }).format(amountMinor / 100);
}

function programmeVariants() {
  return OFFER_CATALOG.flatMap((entry) => entry.variants.map((entryVariant) => ({
    ...entryVariant,
    offer: entry
  }))).filter((entry) => entry.policy !== "group-healing");
}

function markdown(entries, testMode) {
  const grouped = new Map();
  for (const entry of entries) {
    const existing = grouped.get(entry.offerName) || [];
    existing.push(entry);
    grouped.set(entry.offerName, existing);
  }
  const lines = [
    "# Ethel — Rainbow Sanctuary Payment Link Catalogue",
    "",
    `Status: **${testMode ? "STRIPE TEST MODE — no real payments" : "LIVE — approved internal distribution only"}**`,
    "",
    "This is an internal operations list. Do not publish it on the website. Each signed link immediately opens a fresh Stripe-hosted Checkout for the exact fixed option.",
    "",
    "Standard and Early Bird are separate links. Never send an Early Bird option unless its eligibility and deadline have been confirmed for that participant.",
    "",
    "Each total includes Rainbow Sanctuary’s internal payment-processing allowance. Tax-inclusive wording is not approved until Stripe Tax registrations, product tax codes, inclusive tax behavior, and automatic tax have been verified.",
    "",
    "Group Healing is intentionally excluded because participants book its confirmed public session through the website.",
    ""
  ];
  for (const [offerName, variants] of grouped) {
    lines.push(`## ${offerName}`, "", "| Payment option | Total | Secure payment link |", "|---|---:|---|");
    for (const entry of variants) {
      lines.push(`| ${entry.name} | ${formatMoney(entry.amountMinor, entry.currency)} | [Open Stripe Checkout](${entry.url}) |`);
    }
    lines.push("");
  }
  lines.push(
    "## Operating rule",
    "",
    "1. Confirm the participant, programme, price, currency, schedule, and applicable terms.",
    "2. Record the confirmed offer in the CRM.",
    "3. Copy only the matching link from this catalogue.",
    "4. Confirm the verified Stripe payment appears against the same participant before fulfilment.",
    "5. If a link is shared incorrectly, remove that offer ID from the staff allowlist or rotate the signing secret.",
    ""
  );
  return lines.join("\n");
}

async function main() {
  const secret = process.env.PAYMENT_INVITE_SIGNING_SECRET || "";
  const baseUrl = String(process.env.PAYMENT_INVITE_BASE_URL || "").replace(/\/$/, "");
  if (secret.length < 32 || !baseUrl.startsWith("https://")) {
    throw new Error("A signing secret and HTTPS payment invitation base URL are required.");
  }
  const base = new URL(baseUrl);
  const testMode = !base.hostname.endsWith("rainbowsanctuary.life") ||
    base.hostname.startsWith("staging.");
  if (!testMode && process.env.STRIPE_PAYMENT_LINKS_LIVE_APPROVED !== "true") {
    throw new Error("Live staff payment links are not approved.");
  }

  const entries = programmeVariants().map((entry) => {
    const parameters = new URLSearchParams({
      offer: entry.id,
      v: "v1",
      sig: paymentInviteSignature(entry.id, secret)
    });
    return {
      id: entry.id,
      name: entry.name,
      offerName: entry.offer.name,
      amountMinor: entry.amountMinor,
      currency: entry.currency,
      url: `${baseUrl}/api/stripe/payment-invite?${parameters.toString()}`
    };
  });

  const output = resolve(argumentValue("--output") || "payment-link-catalog.md");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, markdown(entries, testMode), "utf8");
  console.info(`Generated ${entries.length} signed ${testMode ? "test" : "live"} payment links.`);
  console.info(`Internal catalogue: ${output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

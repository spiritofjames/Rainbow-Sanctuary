const PAYMENT_LINK_ID_PATTERN = /^plink_[A-Za-z0-9]+$/;
const OFFICIAL_CONTRIBUTION_PAYMENT_LINK_ID = "plink_1U34gMHrqlaOfUb7Ftu9QoG6";

export function isOptionalContributionSession(session, environment = process.env) {
  if (session?.metadata?.contribution === "true") return true;

  const configuredLinkId = String(environment.STRIPE_OPTIONAL_CONTRIBUTION_PAYMENT_LINK_ID || "").trim();
  const allowedPaymentLinkIds = [OFFICIAL_CONTRIBUTION_PAYMENT_LINK_ID, configuredLinkId]
    .filter((linkId) => PAYMENT_LINK_ID_PATTERN.test(linkId));
  return allowedPaymentLinkIds.includes(session?.payment_link);
}

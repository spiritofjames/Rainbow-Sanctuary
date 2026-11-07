# Karma booking production candidate - 3 November 2026

## Scope and acceptance

Owner reports the repaired protected-staging flow "works well" and requests production publication. This candidate is built from production main `7a7d7e1eeaf313e152d8c126b0952c89054af286`, transferring only the Karma changes accepted on staging `63dd04735e95fe044668954021df73c0d3cf48a4` (PR185-188). It does not merge the staging branch wholesale.

- Price: USD 500. Owner-supplied destination: `https://book.stripe.com/3cIdR9dEd1mdfU15ov3Nm0q`.
- Book this session -> required name, email, WhatsApp, context, intended outcome, recent headshot and consents -> save restricted application -> continue to Stripe.
- No timezone or preferred-day/time fields. Payment does not reserve an appointment time. Manager agrees the appointment with the customer.
- Private storage remains fail-closed; unsuccessful persistence cannot release a payment URL. Service configuration failures return HTTP503 and preserve form inputs.
- Original Home.dc.html is byte-identical to production. New identity homepage, unrelated staged schema work and family/youth changes are excluded.
- No production settings, Stripe settings, customer submissions, CRM writes, emails or charges were made while preparing this candidate.

## Verification

- `npm run quality:preflight`: 272 tests pass, zero failures; 28 email templates/contracts; 66 HTML pages; 358 public files; release integrity and discovery checks pass. Staging's three additional schema tests are not in this narrow production change.
- Matching package-lock SHA256 `eec46897ab957284888fe45bdd07f97791f89f097444ce03b6fb9c23229899cb`; existing approved local dependencies reused, no installation/download.
- Owner-reported current staging acceptance is distinguished from earlier actual QA: previous candidate saved a labelled private HubSpot note and delivered the customer receipt and Ethel alert. No independent fresh live paid-event test has passed for this candidate.
- Existing production private-intake, retention, HubSpot and Resend variable bindings are present. They are stored as non-retrievable secret values, so metadata is not proof of their runtime values. No secrets were requested or exposed.

## Remaining promotion decision

Automated paid-payment reconciliation and payment-confirmation remain unverified: actual Stripe Payment Link mapping, webhook configuration, converted-currency event handling and a provider test-mode paid event. Local mocked signed-event tests are not provider evidence. No real charge is authorized for verification.

James explicitly selected **Publish with manual payment verification** on 3 November 2026 after the unverified automated paid-payment handoff was disclosed. Ethel must verify each payment directly in Stripe and match the application before arranging the appointment; neither an application receipt nor the checkout redirect proves payment. This is an owner-accepted, bounded release exception, not complete payment-system certification or a new qualified privacy/legal/accessibility/device review. No customer charge or automatic user-form resubmission is authorized for release testing.

## Rollback and deployment boundary

Rollback target: production commit `7a7d7e1eeaf313e152d8c126b0952c89054af286`, Vercel `dpl_CSA7TteHJdKvvf1fbiXQC4PECW6P`, READY and aliased to rainbowsanctuary.life before release. Publication must use a protected main PR with exact-head guard after required checks. No direct branch push, `vercel --prod`, bypass link or protection weakening.

If promotion is authorized, verify Vercel READY on the exact main merge SHA, original homepage, Karma price/CTA and simplified form, clean/legacy routes and discovery. Production CRM/email/payment success requires separate evidence; a page smoke check alone is not a successful transaction.

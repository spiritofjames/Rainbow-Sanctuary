# Ongoing ReGeneration Maintenance update

Date: 10 November 2026; revised 11 November. Status: split-page update published and verified via PR205 (staging) and PR206 (production). Original candidate history below is preserved.

## 11 November revision: overview and continuation are separate

James requested a visible route from the original Maintenance page, protected staging checks, then public publication after testing. This supersedes the original ongoing-only replacement described below.

- `/144-stages-maintenance` retains the initial 4-Monday and 12-Monday pathway. The August–November 2026 cycles are clearly completed, with no expired purchase controls.
- Its “Completed your cycle?” panel links prominently to `/regeneration-maintenance-ongoing`.
- `ReGeneration-Maintenance-Ongoing.dc.html` contains the USD 110/month offer, two remote collective sessions per month, the approved Stripe link, and a backlink to the overview.
- Programs & Events links directly to ongoing support. Both Maintenance pages preserve the existing noindex policy; no private/sensitive route was added to discovery.
- No provider settings, customer records, payment or messaging actions are included. New subscription automation remains unverified. James renewed public-release approval after human review gaps and manual operational checks were explicitly disclosed; they remain exceptions, not passed reviews.

The earlier verification below applies to the 10 November candidate, not this revised split-page build. Current evidence is recorded separately in `docs/quality/maintenance-split-20261111-release.md`.

## Approved scope

Update the existing Maintenance landing page for people who have completed their initial cycle, using the owner-supplied ongoing subscription link. Direct reading of relevant source, configuration and tests was explicitly approved after the code graph returned obsolete paths.

- Branch: `codex/maintenance-ongoing-20261110`.
- Isolated worktree: `/tmp/rainbow-maintenance-20261110`.
- Original base: `2524d995579df9d89ff78814ddc11b28976e9300` (`origin/main`, fetched before editing). Before the PR, fast-forwarded to `origin/staging` at `b40817e`; main and staging had identical trees. The full quality preflight passed again on that base.
- No production/staging changes, promotional sends, payments, provider configuration changes or CRM/customer writes.

## Current offer

- USD 110 per month, recurring monthly.
- Two remote collective Maintenance sessions per month.
- No Zoom, call, check-in or live attendance required.
- For ReGeneration Level I and II graduates who completed their initial 4-Monday or 12-Monday Maintenance cycle.
- Separate opt-in: an earlier one-time cycle purchase does not automatically start a subscription.
- Registration: https://buy.stripe.com/aFa9AT6bL8OFcHP9EL3Nm0r

The public Stripe Checkout page was inspected without entering personal or payment data. Selecting USD displayed “Billed monthly $110.00”. Its initial local-currency option displayed PAB 114.40 with a conversion; the website explains that customers can select USD and review the final total. No payment or subscription was created.

## Changed files

- `144-Stages-Maintenance.dc.html`: current subscription copy, one subscription card, direct Stripe link, billing explanation, eligibility, preparation and FAQ. Removed the expired USD 210/630 purchase controls and page-specific legacy checkout loader. Existing noindex policy and artwork retained.
- `Explore.dc.html`: replaced the expired opening-cycle promotion with the current twice-monthly subscription.
- `site-config.js`: current public pricing/link/frequency. The dated opening-cycle item is no longer marked open/ongoing. Historical dates, amounts and private schedule remain intact; no future dates were invented.
- `supported-pathways.css`: scoped single-card layout, wrapping CTA and keyboard focus.
- `markdown/explore.md`: regenerated to match the visible promotion. Maintenance itself remains excluded according to its existing noindex policy.
- `tests/maintenance-ongoing-subscription.test.mjs`: five regression checks for offer, eligibility/billing, config/promotion, historical schedule preservation and scoped styling.
- `tests/supported-pathways.test.mjs`: current offer assertions; legacy server/payment checks retained.
- `tests/home-connection.test.mjs`: strict Programs & Events content baseline refreshed after reviewing its three-line promotion change. All other content remains protected by the full-content hash.

## Verification

- Locked dependencies reused locally only after both package-lock SHA-256 values matched: `eec46897ab957284888fe45bdd07f97791f89f097444ce03b6fb9c23229899cb`. No downloads, installs or lifecycle scripts.
- Focused tests: 48 passed, including original checkout, payment-email, HubSpot and reminder regression tests.
- Full `npm run quality:preflight`: exit 0; 326 tests passed; 28 email templates and 28 disabled automation contracts validated; release integrity passed; 87 HTML pages validated; metadata audit reported no errors or duplicate titles/descriptions; public build produced 474 files.
- `git diff --check`: passed.
- Local browser: 1280px desktop and 390px mobile; no horizontal overflow; hero image loaded; subscription CTA fits the card. The CTA navigated to the correct live Stripe subscription checkout. No form or payment submitted.
- First focused test attempt failed because its configuration harness ran unrelated DOM initialisers. The harness was narrowed to the public data declaration, then passed.
- First full run found the intended strict Programs & Events hash mismatch; the reviewed promotion change was recorded in the baseline before the successful full rerun.

## Before release / promotion

1. James requested a review PR after the ongoing-only replacement and missing automated handoff were explained. This draft replaces the expired 4/12-week purchase choices; it does not add a separate continuation page or reopen initial cycles. Merging to staging or production remains a separate decision.
2. Stripe's product description still begins with the old fixed-start, one-time-cycle wording before describing ongoing Maintenance. Recommended replacement (not saved to Stripe):

   > Ongoing ReGeneration Maintenance following your initial 4-Monday or 12-Monday cycle. Includes two remote collective maintenance sessions per month, with no live attendance required. Billed monthly.

3. Confirm the actual ongoing session dates operationally. They are not guessed or published here.
4. Subscription fulfillment, recurring-payment webhook processing, HubSpot enrollment and customer/manager email delivery for this new Payment Link were not tested or changed. Passing existing legacy-cycle tests does not establish those live subscription behaviors.

## Optional invitation draft (not sent)

**Continue your ReGeneration practice**

If you have completed your initial Maintenance cycle and would like ongoing support, you can now continue with two remotely held collective sessions each month. There is no Zoom, call or live attendance to join.

Ongoing Maintenance is USD 110 per month, billed as a monthly subscription. It is a separate choice; your completed cycle does not automatically enrol you. Review the subscription details and register through Stripe:

https://buy.stripe.com/aFa9AT6bL8OFcHP9EL3Nm0r

If you would like the current session dates or have a question before deciding, contact the Rainbow Sanctuary team.

## Local security audit record

- T1 local-write preflight: exit 0 / PERMIT, 10 November 2026 at 20:57:58 UTC.
- T1 tool/test preflight: exit 0 / PERMIT, 10 November 2026 at 21:24:01 UTC.
- Earlier task-scoped network-read receipts are retained in the umbrella project's `.security/authorizations/` for the exact public link/page check and Git baseline fetch.
- No secret values or customer records were inspected or copied into this artifact.

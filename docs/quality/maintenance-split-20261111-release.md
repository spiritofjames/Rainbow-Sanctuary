# Maintenance continuation release — 11 November 2026

## Scope and owner direction

Restore the initial-cycle overview and add a prominent continuation link to the separate ongoing Maintenance page. James authorized protected staging and public publication after testing. No audience sends, provider changes, payments, subscriptions or customer/CRM writes.

## Candidate

- Feature branch: `codex/maintenance-ongoing-20261110`; PR #205 targets `staging`.
- Overview: `/144-stages-maintenance`, including `#choose-commitment`.
- Ongoing: `/regeneration-maintenance-ongoing`; USD 110 monthly, two remote collective sessions/month; separate opt-in after the initial cycle.
- Stripe destination: `https://buy.stripe.com/aFa9AT6bL8OFcHP9EL3Nm0r`.
- Historical 4/12-Monday cycles remain visible but closed; no future dates invented.
- Homepage and unrelated API/backend code unchanged. Existing Maintenance noindex policy preserved.

## Verification status

Revised full quality preflight passed: 328 tests, 28 email templates and 28 disabled automation contracts, 26 release-integrity required files, 88 HTML pages, 84 audited routes and 79 sitemap entries with no metadata errors/duplicates, 475 packaged public files. `git diff --check` passed. Local browser at 390px and 1280px showed no horizontal overflow; completed-cycle cards are closed and the subscription link targets the exact approved Stripe URL.

The first full run passed all tests but failed static validation because the new noindex route was absent from the validator's noindex route list. The list was aligned with the generator; the complete rerun passed. No assertions were removed.

Pending: hosted CI/preview, authenticated staging desktop/mobile, clean routes/legacy redirect, CTA destination and source-denial checks. Local tests are not evidence of live Stripe subscription fulfillment.

## Explicit gaps

- Human privacy/legal, screen-reader and physical-device reviews are not supplied for this candidate.
- Stripe subscription webhook, HubSpot enrollment and recurring customer/manager email delivery are unverified; no claims of tested automation.
- Stripe product description still mixes initial-cycle and ongoing wording. No provider edit authorized.
- Actual twice-monthly session dates require team confirmation; none invented.
- Production is held pending the current-task owner decision on documented review exceptions and manual subscription verification.

## Rollback and release

Before promotion, record the current main commit and production deployment. Use reviewed Git PRs only, feature → staging → main; leave staging authentication enabled. Do not promote an unverified deployment or disable protection. Post-release verify overview, ongoing route, Programs & Events, Stripe destination and standard smoke endpoints.

## Security evidence

Relevant T0/T1 local reads/writes/tests use successful PERMIT preflights. External commits/pushes/merges require separate single-use task-scoped receipts with exact GitHub destinations. No dependency download/install performed; existing lock-matched dependencies reused.

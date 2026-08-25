# Release quality gate

Use this checklist for every website, automation, or provider-integration release.

## Before requesting review

1. Run `npm run quality:preflight` from the website workspace. The pull-request workflow also runs `npm run quality:generated-check` from its clean checkout, so a local uncommitted edit never produces a false failure.
2. Confirm that the change includes a regression test for any failure it fixes.
3. If a page, booking offer, confirmation email, reminder, or calendar action changed, run the relevant focused test too.
4. Review the generated-file diff. Do not release an unexpected knowledge, sitemap, robots, or discovery-layer change.

## Before promoting to production

1. Confirm the pull-request quality workflow is green.
2. For a payment or registration change, use the provider's approved no-charge/test mode path and verify: payment state, contact creation or update, correct program record, immediate confirmation, and correct calendar/Zoom outcome.
3. For any scheduled reminder change, trigger a controlled test or inspect the scheduled job configuration; do not wait for a real attendee to discover an issue.
4. Check the affected route on a mobile viewport and a desktop browser, including a fresh page load and a return from Stripe Checkout.
5. Promote only with the authorised release path. Direct production deployment is not a substitute for this gate.

## After promotion

1. Run `npm run quality:production-smoke`.
2. Open each materially changed public route once in production.
3. If a failure appears, create or update the GitHub production incident before implementing the next change.

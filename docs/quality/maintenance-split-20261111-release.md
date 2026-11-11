# Maintenance continuation release — 11 November 2026

Status: published and verified through PR #206, production commit `ae25aecb149f8d9c1f97406a695453153fd0da9c`, Ready deployment `dpl_Ce9WFQppM6FdFfQCok94z9n2QCha`; exact SHA and public domain aliases verified.

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

Hosted Site quality and Vercel checks passed for feature commit `e5cdf48b05c69d2e649ab26768882bc78a10f08a`. PR #205 merged to staging as `8c7b2023db30ed3604d1e5c3164606e8eccc39e1` on 11 November 2026 at 07:27 UTC. Vercel staging deployment `dpl_9yNk8mSiGdsBmsk6oMgE5a8KYjkN` is Ready for that commit.

Authenticated browser acceptance at `staging.rainbowsanctuary.life` passed: original shared `#choose-commitment` fragment, two closed opening-cycle cards, overview → ongoing navigation, mobile at 390px and desktop at 1280px without horizontal overflow, loaded hero image, correct production canonical/noindex metadata, ongoing legacy `.dc.html` redirect, Programs & Events destination, and live Stripe Checkout navigation without entering any customer or payment data. `package.json` visibly returns 404; robots and LLM discovery files load. Staging protection remains enabled; no bypass link created. The Stripe page initially offers PAB conversion; USD remains selectable. Public Stripe USD 110/month was separately verified in the earlier candidate check.

Local and browser checks do not establish live Stripe subscription fulfillment. After the final response disclosed the review gaps and manual subscription checks, James renewed the instruction “ppusht to production” on 11 November. This is recorded as owner approval to publish this bounded static-page release with those disclosed exceptions, not as certification of the reviews or automation.

Fresh full quality preflight on the exact staged candidate passed again before promotion. Required Site quality and Vercel checks passed; no unresolved PR threads. After publication all 14 endpoint smoke checks passed, including protected staging HTTP302. Public overview, ongoing and Explore pages return200 and match the tested source byte-for-byte; ongoing legacy URL returns308 to the new route; package.json and scripts/validate_site.py return404. Live browser verified overview→ongoing, USD110 monthly presentation, exact Stripe destination and no overflow. No customer/payment data submitted. No rollback needed.

## Explicit gaps

- Human privacy/legal, screen-reader and physical-device reviews are not supplied for this candidate.
- Stripe subscription webhook, HubSpot enrollment and recurring customer/manager email delivery are unverified; no claims of tested automation.
- Stripe product description still mixes initial-cycle and ongoing wording. No provider edit authorized.
- Actual twice-monthly session dates require team confirmation; none invented.
- Owner approved publication after the explicit disclosure above. Ethel/the manager must verify subscriptions manually in Stripe; the new subscription automation remains unverified.
- Independent existing Knowledge decision intake/capture failed at “Send signed release decision” on staging. Its unchanged workflow sends internal release Git metadata to the private Hub, not customer payment/email data. Failure disclosed in PR206 before merge; not represented as passed or repaired. No replay or Hub configuration change performed.

## Rollback and release

Verified rollback target: current main `2524d995579df9d89ff78814ddc11b28976e9300`, Ready production deployment `dpl_9V3wZcbHNVyanThwX7coNmy3Lp4k`. Use reviewed Git PRs only, feature → staging → main; leave staging authentication enabled. Do not promote an unverified deployment or disable protection. Post-release verify overview, ongoing route, Programs & Events, Stripe destination and standard smoke endpoints.

## Security evidence

Relevant T0/T1 local reads/writes/tests use successful PERMIT preflights. External commits/pushes/merges require separate single-use task-scoped receipts with exact GitHub destinations. No dependency download/install performed; existing lock-matched dependencies reused.

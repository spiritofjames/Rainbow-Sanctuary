# Homepage and January retreat production candidate — 7 November 2026

## Approved scope

James requested all staged changes in PR195, then approved the local hero refinements and requested production publication. Candidate includes the new initial homepage, the preserved original programmes homepage at /explore, Knowledge-library updates, staged pricing presentation, and the 18–24 January 2027 retreat at /awakening-your-inner-light-Jan-2027.

Hero refinements: 32px additional header clearance, no decorative top rainbow stripe, square upper corners and existing rounded lower corners. Approved copy and images retained.

## Reconciliation

Production main 708aa3ce1affdf6f456a3cc9c65813613ab3d12a was merged into the staging-based candidate. The four conflicts were inspected individually. Resolutions retain January enquiry context, the newer Karma price-card presentation, the original homepage at /explore and the corresponding test. The working USD500 save-then-pay application flow is retained unchanged. Beyond the existing staged content, the merge adds only the historic Karma release record; no production fix was discarded.

## Technical evidence

- Full build after reconciliation: 308 tests passed; 28 email templates and 28 disabled automation contracts validated; release integrity passed; 77 HTML pages; 443 public files.
- Local hero viewport checks at 320, 390, 482, 768 and 1440px: no horizontal overflow, both header actions available, transparent-to-capsule scroll behaviour retained.
- Computed hero radii: upper corners 0px; lower corners 24px mobile, 32px desktop.
- January staging checks from PR194: old retreat URL redirects to new canonical, calendar lists January18–24, banner and form context agree. A new deployed integration check is still required.
- No new dependencies, provider configuration changes, actual form submissions, CRM writes, emails, payments or WhatsApp messages are part of this release task.

## Acceptance boundary

Owner visual approval and production request recorded. Existing manual Stripe payment verification remains necessary: Ethel verifies payment in Stripe and matches the application before arranging the appointment. Automated paid-event confirmation remains unverified.

Human privacy/legal, screen-reader and physical iOS/Android reviews are not certified by automated checks. Owner direction on carrying these exceptions forward to the expanded release was requested; production remains gated until the decision and deployed staging verification are recorded. This candidate record does not mark the historical Phase4 checklist complete.

## Rollback

Pre-release production: main708aa3ce1affdf6f456a3cc9c65813613ab3d12a; READY deployment dpl_3cBcandHuvmN4UpWu7dwqdYQspWw, immutable URL rainbow-sanctuary-website-qsoq257ly.vercel.app.

Release via protected PRs only. No direct main/staging push, no protection bypass, no local production deployment. Capture the exact merged SHA, READY deployment and live smoke evidence before reporting the site live.

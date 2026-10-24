# Release log

## 2026-10-23 — December retreat, participant films and branded link previews

- **Release owner:** James.
- **Pull requests:** #167 (staging), #168 (production).
- **Production commit:** `399381ec8751f5b67479b63478e35c2d0ae29729`.
- **Production deployment:** `dpl_2UiPt82Dofd7FWdZxABgtRAUCnS1` (Ready).
- **Previous deployment / rollback:** `dpl_8j8CMB35g8jxyM9eMPEMTxGS8FQv`, commit `82e25343113c68599e10be3a2ab0829e588251ca`.
- **Summary:** Publish December3–9 retreat content, branded social metadata/images, calendar/form routing, three manual-play participant films, supplied Garlon/Leonella covers and one hero registration CTA. Owner explicitly included staged recurring family/youth schedules. Production Trustpilot/HubSpot fixes retained; internal Academy planning/authorization records excluded.
- **Verification:** 218 automated tests, 66 HTML pages, email/release/discovery checks; 68 HTTP checks on staging and production; desktop/mobile browser review, calendar/form-prefill and manual video playback checks. Prior approved HubSpot/Resend intake delivery evidence retained without duplicate submissions.
- **Review exceptions:** James explicitly accepted missing human privacy/legal, accessibility and physical iOS/Android reviews for this release. They are not claimed as passed. See [acceptance record](releases/2026-10-23-december-retreat.md).
- **Rollback required:** No.

## 2026-08-15 — Production recovery and release safeguards

- **Release owner:** James / Rainbow Sanctuary team
- **Pull requests:** #74 (recovery to staging), #75 (recovery to production), #76 (release contract and navigation safeguard)
- **Production commit:** `cb22efe456e378a2b5ef379c7d97828c75b8edf5`
- **Summary:** Restored the branded favicon and the ReGeneration Maintenance reminder function; re-established GitHub `main` as the production source of truth; and verified Vercel's native Git deployment path.
- **Safeguards added:** Protected-branch review and quality gates, a release-integrity contract for the favicon, navigation structure, key public pages and server endpoints, plus protection against the discovery publisher removing the Monday reminder cron.
- **Verification:** Application tests, email-template validation, release-integrity validation, static-site validation, Vercel production inspection, and public endpoint checks passed.
- **Rollback required:** No.

Record production promotions and rollbacks here. Newest entry first.

## Template

- Date:
- Release owner:
- Pull request:
- Production commit:
- Previous deployment/rollback target:
- Summary:
- Verification:
- Rollback required: No

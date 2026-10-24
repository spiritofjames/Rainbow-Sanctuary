# Release log

## 2026-10-24 — James story layout and full in-page song

- **Release owner:** James; explicitly requested production publication after the corrected recording copy and approved resuming the paused release.
- **Pull requests:** #176 (story/player staging), #177 (recording copy staging), #178 (production).
- **Production commit:** `7a7d7e1eeaf313e152d8c126b0952c89054af286`.
- **Production deployment:** `dpl_CSA7TteHJdKvvf1fbiXQC4PECW6P` (Ready; exact commit and public domain verified).
- **Previous deployment / rollback:** `dpl_Brv5u2Ph2zrJxSn6HtXweNEqm4fF`, commit `53b950ea4569610c7c7fee925cc095519a44191d`.
- **Summary:** Align the larger James portrait with a shorter personal account, span the song player beneath both, and play the complete owner-supplied 5:59 recording directly on the page. Preserve a separate Spotify link. Use James's exact ceremony-after-initiation attribution in HTML and generated Markdown; remove the former Spotify loading gate and align privacy text.
- **Verification:** Fresh 252 tests, 66-page validation, 27 email templates/contracts, release integrity and public packaging; green protected PR and post-merge staging/production checks. Live desktop/mobile layout, exact copy, playback, clean/legacy routes, discovery, source-file 404s and audio range delivery checked. No form, CRM, email, payment or provider writes.
- **Review boundaries:** Prior owner-accepted missing qualified privacy/legal, accessibility certification and physical-device reviews remain exceptions, not passed reviews. Personal story remains attributed and is not an independent guest review or an outcome promise. See [release evidence](releases/2026-10-24-james-story-player.md).
- **Rollback required:** No.

## 2026-10-24 — Public AI discovery, performance and source containment

- **Release owner:** James; explicitly requested “push to production” after the protected staging handoff.
- **Pull requests:** #173 (staging), #174 (production).
- **Production commit:** `53b950ea4569610c7c7fee925cc095519a44191d`.
- **Production deployment:** `dpl_Brv5u2Ph2zrJxSn6HtXweNEqm4fF` (Ready; public domain verified).
- **Previous deployment / rollback:** `dpl_Hg4HWSTyJKLR6Aas2Ny9gAj5QpDm`, commit `43240a8abc5efdecfd4ae411e18f9f5b04660d1d`.
- **Summary:** Publish 58 public-page Markdown mirrors and their directory, consistent metadata/headings/schema and discovery routes, bounded loading improvements, the approved Trustpilot profile link and white retreat discovery-call link. Serve only the explicit public-build allowlist; unpublished source, docs, tests, scripts and package metadata are no longer publicly served. Existing native API behavior is preserved.
- **Verification:** Fresh 252 tests, 66-page validation, 27 email templates/contracts and 25-file release integrity; green GitHub Site quality and Endpoint health; 130 production HTTP checks passed; desktop/mobile browser review and December discovery-call prefill/unchecked consent verified without submission. Source-path HEAD checks return 404; API GET returns 405.
- **Review boundaries:** No new human privacy/legal, accessibility certification or physical-device sign-off; prior owner-accepted exceptions remain explicit. No live CRM/email/payment write tests, actual AI-citation/indexing claims or field Core Web Vitals claims. Pre-existing literal `<mark>` text in search excerpts remains a minor follow-up. See [release evidence](releases/2026-10-24-geo-production.md).
- **Rollback required:** No. Reverting to the previous deployment would also restore its source-file exposure; prefer a reviewed forward fix unless a more severe fault requires rollback.

## 2026-10-23 — German testimonial portrait cover

- **Release owner:** James; explicitly approved publication through staging to live.
- **Pull requests:** #170 (staging), #171 (production).
- **Production commit:** `43240a8abc5efdecfd4ae411e18f9f5b04660d1d`.
- **Production deployment:** `dpl_Hg4HWSTyJKLR6Aas2Ny9gAj5QpDm` (Ready; public domain verified).
- **Previous deployment / rollback:** `dpl_2UiPt82Dofd7FWdZxABgtRAUCnS1`, commit `399381ec8751f5b67479b63478e35c2d0ae29729`.
- **Summary:** Replace German Sozzi's landscape testimonial still with the owner-supplied portrait. Preserve the original source, video ID, manual playback, card copy, other covers and all intake routing. Add descriptive alt text, dimensions, provenance and regression coverage.
- **Verification:** 219 automated tests, 66-page validation, email/release/discovery checks; protected preview desktop/mobile checks; staging legacy redirect and Play/Stop checks; 68 production HTTP checks and exact published-image SHA-256 match. Live portrait loaded at 900 × 1955; no participant-video iframe before interaction.
- **Review boundaries:** This is a cover-only update. No new legal, accessibility certification, physical-device review, testimonial claims or end-to-end email-delivery claims. Previous release review exceptions remain documented in its acceptance record.
- **Rollback required:** No.

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

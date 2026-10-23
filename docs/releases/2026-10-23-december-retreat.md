# December retreat and branded sharing release — 23 October 2026

## Scope and owner decisions

James authorized the December retreat release, its approved branded link previews,
Leonella's Spanish testimonial, the supplied Leonella/Garlon portrait covers, and
a single hero registration button. Discovery-call access remains below the hero.
On 23 October James explicitly included the staged family/youth recurring-calendar
updates in this publication.

The release integrates production commit
`82e25343113c68599e10be3a2ab0829e588251ca`, retaining its Trustpilot layout and
portable HubSpot fixes. Seven internal Academy planning/authorization records
absent from production are excluded. The cloud-backed original checkout is
preserved; release work uses an isolated fresh checkout.

## Acceptance evidence before hosting

- `npm run quality:preflight`: 218 tests passed; 27 email templates and 27 disabled
  automation contracts checked; release-integrity and all 66 HTML pages passed.
- Discovery generation covers 59 canonical routes and is reproducible.
- Desktop visual review shows three portrait testimonial cards; mobile checks at
  320, 375, 390 and 768 pixels found no horizontal overflow.
- Leonella's embedded film played after an explicit tap in the mobile preview.
  Stop removed the player and restored the supplied portrait cover.
- No participant iframe is loaded before Play. The exact Leonella embed URL is
  included in the runtime allowlist and generated Content Security Policy.
- Hero contains exactly one `Register Your Interest` link for December; the lower
  discovery-call link retains the December programme and discovery intent.
- Earlier approved staging QA verified the two intake paths in HubSpot and four
  Resend Delivered records (two acknowledgments and two team alerts). This release
  does not change the intake transport or email delivery implementation. Those
  checks are prior evidence, not newly submitted enquiries or proof of inbox reading.
- No payment code or amounts were changed by the final testimonial update; no
  payment transaction was performed in this verification.

## Explicit review exceptions

James's direct response on 23 October was: “Publish with those documented review
exceptions” after being told that named human privacy/legal and accessibility
reviews, plus physical iOS/Android checks, were missing. This is owner acceptance
for this release only, not a claim that those reviews passed or a general change
to the Phase 4 policy. Automated checks do not replace qualified human approval.

Full testimonial transcription, Spanish subtitle accuracy, independent legal or
clinical review, screen-reader certification and physical-device testing are not
claimed. The new clip is identified as Spanish and contains no invented quotation.
Social metadata can be verified at the origin; third-party cache refresh timing
is outside the deployment's control.

## Rollback target

- Production commit before release: `82e25343113c68599e10be3a2ab0829e588251ca`.
- Vercel deployment: `dpl_8j8CMB35g8jxyM9eMPEMTxGS8FQv`.
- Immutable deployment: `rainbow-sanctuary-website-7fyspuvne.vercel.app`.

## Hosted verification

Pending: protected preview, staging acceptance, production pull request, and
post-publication HTTP/browser checks. Local passing checks alone are not deployment.

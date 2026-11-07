# Awakening Your Inner Light — January 2027 reschedule

Owner instruction: 6 November 2026. The upcoming retreat moves from 3–9 December
2026 to **18–24 January 2027**. Duration and published investment remain seven
days, six nights and USD 3,500 per person. Venue and final programme remain subject
to confirmation; this change does not activate retreat payments.

## Public routes and source ownership

- Canonical route: `/awakening-your-inner-light-Jan-2027` (owner's exact spelling).
- Old `/awakening-your-inner-light-2026` and lowercase `jan-2027` redirect permanently
  to the canonical route, as does the existing `.dc.html` source URL.
- The prior public Markdown URL redirects to its January equivalent.
- `Awakening-Your-Inner-Light-2026.dc.html` remains the source filename to avoid
  needless source/asset churn. Existing image/audio directories retain provenance.
- `site-config.js` owns calendar dates. `Explore.dc.html` owns the existing
  programmes/home retreat banner. Discovery generation updates schemas, search,
  Markdown, sitemap and LLM text consistently.
- New enquiry programme: `awakening-inner-light-january-2027`. Previously shared
  December enquiry links normalize to January on the client and server; source
  attribution is retained. No existing HubSpot records are migrated.
- October 2026 dates remain historical. Legacy October payment offers and payment
  confirmation emails now link explicitly to the October archive, not the new
  interest-only January page. Prices and Stripe identifiers are unchanged.

## Date-bearing sharing artwork

Deployment asset: `assets/social/awakening-inner-light-january-2027-share-20261106.jpg`.
1200 × 630 JPEG, versioned to avoid retaining a December image URL in metadata.
The old image is preserved but no longer selected by active metadata.

Built-in image editing was used with the existing approved December card as edit
target. Master remains at:
`/Users/spiritofjames/.codex/generated_images/019f5acb-88bd-7b32-a7bc-aa16bf1cffdb/exec-0d705025-14b5-4454-b65d-a752ec0c7c44.png`.
`sips` encoded/resized the deployment JPEG. The prompt was:

> Use case: text-localization. Edit target: the supplied Rainbow Sanctuary retreat social-sharing card. Change ONLY the date inside the green pill from 3–9 DECEMBER 2026 to the exact text '18–24 JANUARY 2027'. Preserve every other element, wording, brand lotus, tree, natural ivory background, typography, colors, composition and landscape 1200:630 aspect ratio unchanged. No other changes. Keep text sharp and professional, entirely within the existing pill.

## Verification boundaries

Automated checks cover calendar days, final-day visibility, redirects, canonical
metadata, old-link enquiry normalization, synthetic HubSpot/email contracts,
preserved programmes content, and October history. These are not proof of real
email delivery or a live CRM submission. No external calendar accounts, existing
customer records, payment links, or provider settings are changed by this update.
Staging and production status must be recorded separately after deployment.

Local verification: 307 tests pass; 28 email templates and disabled automation
contracts validate; release integrity passes; 77 HTML pages validate; 443 public
files packaged. Desktop and 390px mobile hero inspected, with no horizontal
overflow. Browser calendar shows every day from 18 through 24 January and links
to the new canonical path. No live form submission was made.

Rollback baseline: staging commit `43dd258b9a911298357fa14981f469ca122927aa`.
Use a reviewed revert on staging if acceptance fails; do not rewrite branch history
or change staging protection. Production remains a separate owner approval gate.

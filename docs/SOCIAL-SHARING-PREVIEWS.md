# Branded social-sharing previews

Updated 23 October 2026. Prepared for protected staging; this document is not evidence of a production release or a refreshed WhatsApp/social cache.

## Cards and routing

| Card | Deployment asset | Used for |
| --- | --- | --- |
| Rainbow Sanctuary | `assets/social/rainbow-sanctuary-share-20261023.jpg` | Homepage, events, October archive, and generic fallback pages |
| Awakening Your Inner Light | `assets/social/awakening-inner-light-december-2026-share-20261023.jpg` | December retreat page only |

Both are 1200 × 630 JPEGs, below 300 KB. Existing topic-specific editorial images remain in place. The October archive keeps its historical October dates and does not show December artwork.

The general card adapts James's approved snippet: rainbow lotus, luminous rooted tree, ivory background, forest-green copy, subtle rainbow light. Its headline is “We're building a new world. Together with you.” The December card highlights 3–9 December 2026, Bocas del Toro, Panama, and preparation, ceremony and integration. These are illustrative brand assets, not venue photographs.

## Metadata ownership

`scripts/publish-discovery-layer.mjs` owns the static canonical, robots, Open Graph, X/Twitter and JSON-LD metadata. It regenerates 59 discoverable routes. Keep changes in that generator and commit the generated HTML; do not patch only the generated image URL.

- All image URLs are absolute HTTPS URLs on the production domain.
- Open Graph and X share image, title, description and alternative text.
- Branded cards declare their real width, height and JPEG type.
- Older duplicate sharing tags are removed before regeneration so a crawler cannot prefer an obsolete first tag.
- The duplicate legacy children-practice WebPage schema was removed; the generated graph remains authoritative.
- Topic-specific page titles and descriptions remain distinct. The homepage has a concise social title while its SEO title and page body stay unchanged.
- `scripts/build-home-social-preview.cjs` builds legacy v1 artwork only; it is not the active card pipeline.

Reference: [Open Graph protocol](https://ogp.me/). Static metadata is available without executing JavaScript.

## Verification and release boundaries

Run the discovery generator before the test suite:

```sh
node scripts/publish-discovery-layer.mjs
node --test tests/social-sharing-previews.test.mjs
npm run quality:preflight
```

The dedicated tests verify JPEG bytes and dimensions, size, correct route mapping, unique metadata tags, matching X/Open Graph values, JSON-LD image consistency and historical date separation. Visual inspection covers the generated masters and final JPEGs. Provider-specific social rendering/cache refresh is a separate post-production check.

Protected staging remains authenticated and noindex. Public social crawlers cannot inspect it. The metadata intentionally retains production URLs; the newly versioned image files will become publicly fetchable only after an approved production promotion. Do not weaken staging protection to test a share preview.

After an approved production release:

1. Confirm the public homepage and December clean URL return the new tags.
2. Confirm both production image URLs return HTTP 200 with image/jpeg, without login.
3. Check legacy retreat redirects resolve to the intended December page.
4. Refresh the URL in the relevant platform's preview/debugging tool where available, then share again. Previously sent messages or cached cards may continue displaying the old preview; image versioning does not force every platform to re-scrape a cached page.

## Asset provenance

Source supplied by James: `/Users/spiritofjames/Desktop/@RainbowSanctuary snippet 2026.png` (1080 × 1920).

Generated with the built-in image tool using that exact reference, opaque background. No API key or CLI image generation was used. The image-generation skill guided reference-led adaptation and small-preview legibility. macOS `sips` was used only for final JPEG encoding and normalization to 1200 × 630; no additional creative edits were made outside the image tool.

Local masters (not deployment assets):

- `output/social-previews-2026-10-23/rainbow-sanctuary-share-master.png`
- `output/social-previews-2026-10-23/awakening-inner-light-december-2026-share-master.png`

### Exact final prompt — general card

```text
Use case: ads-marketing. Asset type: final branded website social-sharing / Open Graph card. Adapt the supplied vertical Rainbow Sanctuary brand snippet into a refined HORIZONTAL 1200:630 composition (approximately 1.905:1, wide landscape). Input image is the brand reference and source for the existing rainbow lotus and luminous rooted tree; preserve their recognizable designs, do not redesign the lotus. Warm ivory/cream background, very faint pastel rainbow light near the tree, deep forest green typography, restrained antique gold accents. Premium editorial, calm, alive, sophisticated, exceptionally clear at small WhatsApp preview size.
Composition: left 58% is clean and spacious typography; upper left an elegant compact horizontal brand lockup with rainbow lotus beside the two-line name Rainbow Sanctuary, not a giant logo. Right 42% features the same beautiful symbolic tree with golden flowing light, broad living green canopy and visible interwoven roots, tree fully visible within generous margins. One subtle fine gold divider, no enclosing card or mockup frame.
Render ONLY this exact text, with visual hierarchy:
brand name "Rainbow Sanctuary"
large elegant dark-green serif headline on 3 lines "We’re building a new world. Together with you."
small but bold readable sans-serif service line, optionally on 2 lines "RETREATS · ONLINE EVENTS" and "HEALING · LEARNING"
footer "BOCAS DEL TORO · PANAMA | NODE 01"
small domain "rainbowsanctuary.life"
Keep all text inside 7% safe margins; headline large enough for thumbnail reading. No body paragraphs, no Follow button, no URL protocol, no people, no extra words, no UnityHub branding, no fake photographic venue. Perfect spelling. Output only the finished image.
```

### Exact final prompt — December card

```text
Use case: ads-marketing. Asset type: final branded December 2026 retreat social-sharing / Open Graph card. Adapt the supplied vertical Rainbow Sanctuary brand snippet into a refined HORIZONTAL 1200:630 composition (approximately 1.905:1, wide landscape). Input image is the brand reference and source for existing rainbow lotus and luminous rooted tree; preserve their recognizable designs, do not redesign lotus. Warm ivory cream background, faint pastel rainbow light near tree, deep forest green type, restrained antique gold. Beautiful editorial spiritual retreat identity, calm and high-end, exceptionally clear at small WhatsApp preview size.
Composition: left 58% clean spacious typography with small upper-left horizontal brand lockup (lotus beside two-line Rainbow Sanctuary). Right 42% same symbolic luminous tree, canopy and roots fully visible within generous margins, representing inner growth. Not a photograph of the venue. Fine gold dividing rule, no outer frame, no UI mockup.
Render ONLY this exact text with hierarchy:
brand name "Rainbow Sanctuary"
large elegant dark-green serif headline, 3 lines: "Awakening" / "Your Inner Light"
medium readable sans-serif "A seven-day plant-medicine retreat"
very clear dark-green pill or simple medium bold line "3–9 DECEMBER 2026"
location line "BOCAS DEL TORO · PANAMA"
small footer "Preparation · Ceremony · Integration"
small domain "rainbowsanctuary.life"
Keep all text inside 7% safe margins and never overlap the tree. No healing promises, no price, no October dates, no booking guarantees, no extra text, no people, no buttons. Perfect spelling. Output only finished landscape card.
```

# Retreat participant privacy replacement

Status: pull-request candidate for staging; not deployed or published. Source application base: `ae25aecb149f8d9c1f97406a695453153fd0da9c`. Remote refs refreshed on 15 November 2026: main `29aaf14`, staging `4d4804d`. Their additional changes are release documentation only, with no overlapping privacy files. Owner requested a PR; no merge or production change is authorized by this step.

## Owner request and scope

James relayed a participant request to replace the name and make the person look completely different in the two specified placements: the ritual journey card and written reflection. The pseudonym is **Alex**. The quotation remains verbatim. A visible note identifies the name change and fictional AI portrait, avoiding a false impression that the generated face is the speaker.

New public files are `testimonials/alex.jpg` and `journey/herb-ritual-privacy-{360,720}.jpg` under `assets/retreats/awakening-inner-light-december-2026/`. Superseded asset paths are removed from this candidate, not merely hidden in the page. Generated Markdown follows the same privacy treatment. This does not erase Git history, external caches, previously downloaded copies, or guarantee that other group photographs contain no recognizable appearances. No production/cache/CDN action is claimed.

## Saved masters and method

Built-in image-generation tool; no CLI/API fallback or new dependencies. Generated masters copied to `output/participant-privacy-20261114/masters/ritual-fictional.png` and `portrait-fictional.png`. That output folder is excluded from public packaging. JPEG delivery derivatives use local image conversion/resizing, with explicit dimensions and lazy loading. The old portrait was moved into the nonpublic local output folder; original source library unchanged.

## Exact prompts

### Ritual replacement

Use case: precise-object-edit. Privacy-preserving fictional replacement for a retreat website illustration. Edit this image: completely replace the seated man's identity, not a subtle face retouch. Make him an entirely unrelated fictional adult man around 50, deep brown skin, broad round face, shaved head, full short salt-and-pepper beard, no glasses, stockier build, wearing a muted sage loose short-sleeved linen shirt and cream trousers. Natural kind expression. Preserve the wooden tropical pavilion, camera viewpoint, cross-legged seated pose, herb bundles in both hands, cushion, lantern, glass drink vessel and all other objects, warm daylight. Photorealistic candid photograph with realistic skin and fabric texture, no beauty filter. Horizontal 4:3 composition. No text, logos, collage, or webpage UI. The replacement must not resemble the original man.

### Portrait replacement

Use case: compositing. Privacy-preserving portrait for a retreat testimonial. Image1 is the scene/edit target: replace its man completely, maintaining the hammock, lush foliage, blurred wooden tropical interior, seated relaxed posture and natural light. Image2 is the fictional identity reference: use exactly this entirely fictional adult man with deep brown skin, shaved head, broad round face, stocky build and short full salt-and-pepper beard. Keep that fictional identity consistent. He is comfortably seated in the white hammock, wearing the same muted sage linen short-sleeved shirt and cream trousers as image2, hands resting naturally in lap, smiling and looking slightly to his left/upward. No glasses, no dark hair, no likeness to original person from image1. Vertical portrait framing, realistic candid photography, natural skin texture, no heavy retouching. No text, logos, webpage UI or collage. This is a fictional illustrative replacement, not a real participant photo.

## Verification

Initial test runs found new JPEGs above existing byte budgets, a test pinning the previous CSS cache key and a sitemap test pinning the previous modification date. Assets were recompressed; cache-key coverage and the date assertion were updated. The sitemap test now checks the source-controlled date record rather than an obsolete literal.

Final `npm run quality:preflight`: 329 tests passed, zero failures; 28 templates and 28 disabled automation contracts validated; release integrity passed; 88 HTML pages passed validation; metadata audit 84 routes/79 sitemap entries with no errors or duplicate titles/descriptions; public packaging 475 files. `git diff --check` passed. Existing local dependencies were reused only after both package-lock SHA-256 values matched; no install or dependency changes.

Local browser check at 491px: both replacement images loaded, pseudonym and privacy note visible, no horizontal overflow. Clean retreat URL and new portrait returned HTTP 200; superseded portrait returned 404. Packaging assertions confirm all three superseded image paths are absent. Local preview: `http://127.0.0.1:4194/awakening-your-inner-light-Jan-2027`. Homepage, Vercel configuration, site settings and API source unchanged. Nothing was staged or published. No private data, forms, CRM, email, payments or provider settings were changed. The user-reported generic chat `Bad Request` was not reproduced or attributed to website code.

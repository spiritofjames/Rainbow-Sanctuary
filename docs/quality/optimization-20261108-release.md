# Optimization sprint - 8 November 2026

## Scope and release state

Owner authorized the site-wide optimization, ten new public articles, three scoped workers, direct source inspection, staging checks and production publication after passing checks. This record starts as **local verified / staging and production pending**. Deployment evidence is appended after each environment is verified. Existing homepage design and approved copy are preserved.

Feature branch: `codex/optimization-sprint-20261108`.

Production baseline and rollback target: commit `34cf85ab73706a74d74620dbea6cf25c369b3b60`, Vercel `dpl_4RLJjeHobdwizssmA6EwukmjtCSb` (READY before this sprint). Roll back through a normal reviewed revert PR if primary routes fail, the search/gallery regression returns, or a new public-source exposure is detected. No database migration is involved.

## Changes

- Ten practical guides covering the ecosystem, co-creation, collaboration briefs, stewardship, family learning, daily integration, spiritual consent, January retreat questions, conscious technology and bounded skills contributions. The public library grows from 15 to 25 articles.
- Single-H1 and heading hierarchy, unique title/description, canonical, sitemap inclusion and valid JSON-LD checks across every public static route. Existing pages already had a sound heading hierarchy; no unnecessary heading or homepage-copy rewrite was made.
- Sitemap dates now require a verified main-content fingerprint. Unknown or changed content omits optional `lastmod` rather than publishing a fabricated build date. Knowledge collection dates derive from the articles they contain.
- Organization/discovery wording aligns with the current public ecosystem, School beta and Stephanie's founder role. Knowledge articles use article metadata and collection relationships consistently.
- HTML, public Markdown alternates, Knowledge feed, sitemap, Pagefind, `llms.txt` and `llms-full.txt` regenerated together. Private/raw source remains excluded.
- Search excerpts safely render only bare highlight tags, with arbitrary HTML escaped. Result URLs use canonical clean routes. Stale asynchronous results are ignored, capped-result wording is accurate, and bylines/TOC/related cards no longer clutter the search index.
- Knowledge pages defer 82,133 raw bytes of existing support/configuration JavaScript that previously blocked the parser. This changes scheduling, not transfer size. Gallery geometry reads move out of the scrolling path (128 repeated geometry reads to zero per active-slide calculation in the focused harness), and the last-slide desktop counter/control bug is fixed.
- `npm run seo:check` joins the normal preflight. Deployment instructions no longer contain obsolete fixed route counts.

## Verification before staging

- Full `npm run quality:preflight`: **321 tests passed**, zero failed/skipped; 28 email templates and 28 disabled automation contracts validated; release integrity passed for 25 critical files; 87 HTML files validated; 474 public files packaged.
- Whole-route SEO audit: **83 public page routes, 79 indexable sitemap routes**, no errors, no duplicate titles/descriptions. Four noindex routes deliberately stay out of the sitemap. One empty lightbox image placeholder is not a failed public image.
- Production baseline: bounded, read-only probe of 50 HTML routes plus discovery/source-denial checks, 58 responses total, no errors. Baseline sitemap had 69 entries. Maximum observed HTTP response time was 1.274 seconds; this is **not** an LCP, Lighthouse, Core Web Vitals or field-performance score.
- Browser: desktop 1440px and mobile 320/390px article layouts have no horizontal overflow; homepage hero retains the approved two-line desktop headline; gallery reaches 16/16 with Next disabled and returns with Previous; search produces actual highlight elements, no literal `<mark>` text and canonical result links. Console warnings/errors absent in the checked local pages.
- Ten article bodies reviewed by the coordinating AI agent against current approved public sources. No invented statistics, qualifications, outcomes, property rights or operating commitments. School/family and voluntary adult retreat pathways remain separate. An independent NIH safety overview is linked where general retreat-risk context is discussed. AI-assisted editorial checks are **not** human clinical/legal/safeguarding review.

Worker records: [editorial](optimization-20261108-editorial.md), [technical](optimization-20261108-technical.md), [performance](optimization-20261108-performance.md).

## Boundaries and inherited exceptions

No booking/API/provider configuration, prices, payment links, customer records, email delivery settings, consent settings or production environment variables changed. No application submitted, email sent, contact created, real charge made or WhatsApp message sent in this sprint. Existing payment confirmation remains manually verified by Ethel; automatic Stripe paid-event handoff is not newly certified here.

Previously owner-accepted missing human privacy/legal, representative screen-reader and physical-device reviews are carried as unresolved reviews, not passed tests. Browser viewport checks are emulation, not physical-device certification. New content is informational and non-clinical. Public wording and schema do not establish legal readiness, clinical suitability or guaranteed outcomes.

No ranking, traffic, AI citation or indexing improvement is guaranteed. `llms.txt` is a supplementary discovery aid, not an AI-platform requirement. No Search Console, analytics, external brand-mention campaign or field CWV dataset was accessed. Google's [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) informed the implementation.

## Security and artifact controls

Work remained in the isolated checkout. Existing matching locked dependencies were reused; no package intake, install scripts, lockfile changes or subscription changes. Local read/write preflights and separate scoped network/delegation/release receipts are retained in the enrolled umbrella project's `.security/authorizations/`. Each material release mutation requires a fresh preflight with exit code zero and parsed `PERMIT`; no direct push to protected branches, force push, auth bypass or `vercel --prod` is allowed.

Expected generated Pagefind shards are rebuilt from the exact public article set. Temporary node_modules symlink, Python caches, raw HTTP reports and screenshots are not staged as public source. Source-denial URLs must return 404 on deployed environments. Protected staging is inspected using the signed-in browser only, with protection left enabled.

## Environment evidence

- Local: verified as above. Reproducibility recheck required immediately before commit.
- Feature preview: pending.
- Custom staging: pending.
- Production: pending.

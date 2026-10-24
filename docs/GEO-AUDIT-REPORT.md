# AI/search discovery and performance — staging review

Date: 23 October 2026 (America/Panama)
Scope: Rainbow Sanctuary public website; staging only. Production is not authorized for this release.
Baseline: staging `22a613fbc6970255945c0534f0b018924772f54d`; production `43240a8abc5efdecfd4ae411e18f9f5b04660d1d`.

## Changes

- Publish text equivalents of the 58 indexable canonical pages under `/markdown/`, with a directory, per-page alternate links, source attribution, canonical HTTP links, and appropriate MIME type. These are public rendered-page text, not raw CMS Markdown or frontmatter. Form controls, hidden panels, scripts and private routes are excluded.
- Preserve `noindex,follow` for knowledge search after regeneration; exclude search from sitemap and Markdown publishing.
- Remove the stale 18 August Scheduled/InStock event from the recurring online-group page. Do not invent future session dates or availability.
- Use an Organization entity for the editorial team and preserve article breadcrumbs. Improve nested Knowledge card heading levels without changing typography.
- Align the extended AI guide with the published child/guardian pathway; keep adult professional training separate.
- Generate discovery artifacts before tests/validation, so validation sees the actual release output.
- Remove old generated Markdown when its source page is unpublished; reject unknown files in that generated directory instead of deleting user-authored work. Omit conditional acknowledgement templates from Markdown.
- Align the two leftover “twice monthly” labels with the existing weekly Tuesday group calendar.
- Preload the existing homepage hero poster and retreat hero background; lazily load two below-fold homepage images, supply image dimensions, and remove an unused image component script. No imagery, crop, autoplay or form behaviour changed.
- Carry forward the approved truthful Trustpilot profile link and white, underlined discovery-call link.

## Evidence and limits

Read-only live baseline checks returned HTTP 200 for `/`, the December retreat, `/children-and-family`, `/online-group-healing`, `/knowledge/search`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt`. Sitemap contained 58 URLs; sampled public pages had one H1 and correct clean canonical URLs. The live search page incorrectly had `index`; the online-group schema contained the expired event. Robots allowed OAI-SearchBot and PerplexityBot. Training permissions were not changed.

Performance source measurements: 2,140,881 bytes of below-fold images moved out of explicitly eager loading. Removed script: 63,740 raw bytes (21,054 locally gzipped). These are source/scheduling improvements, not measured transferred-byte savings or field Core Web Vitals. Browser lazy-loading heuristics may preload nearby images. Hero media itself is unchanged.

Full local/CI and staging verification results are recorded in the release handoff. No live form, payment, CRM, email or subscription mutations are part of this audit.

## Security finding: source-path exposure

A headers-only request to the unpublished editorial-template path under `/content/knowledge/articles/` returned HTTP 200 and Markdown content type on production. The body was not retrieved. This is a confirmed publication-boundary defect; sensitivity and historical access are not established. No secret exposure is asserted.

Owner notified during this task. Repository-only `/content`, `/docs`, `/tests`, `/scripts` and `/output` routes now fail closed through a 404 handler in the staging candidate. This preserves build inputs and source evidence while preventing those files from being served as public content. A protected staging HTTP check must confirm routing precedes static-file delivery. Production containment remains pending a separately authorized promotion; do not describe this as fixed live.

## What remains outside this release

- Search Console ownership, index coverage and generative-AI inclusion/report settings are not inspected or changed. Actual indexing and citations cannot be guaranteed by site tests.
- Field LCP/INP/CLS and real-user traffic are not measured here. Consider a separate responsive-image/video optimization pass and field monitoring. Do not make mutable assets immutable without a cache-versioning plan.
- The shared rendering runtime loads React/ReactDOM from unpkg. Replacing that runtime needs separate design/regression work; do not casually defer its dependency order.
- The December venue remains unconfirmed. Event structured data deliberately omits a fabricated location, so rich-result completeness is not claimed.
- Broad market visibility, competitor citations, review authenticity/legal review and human accessibility certification are not established by this technical pass.

## Primary documentation used

- [Google's generative AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): foundational SEO, useful content and technical clarity; no special AI schema required.
- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots): search and training controls are independent.
- [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers): PerplexityBot supports search, not foundation-model training.
- [llms.txt proposal](https://llmstxt.org/): optional agent-friendly discovery convention, including alternate Markdown links; not a guarantee of inclusion or ranking.

The GEO skills informed the checks, but claims about guaranteed ranking, universal bot JavaScript behaviour, or mandatory AI-only files were not adopted.

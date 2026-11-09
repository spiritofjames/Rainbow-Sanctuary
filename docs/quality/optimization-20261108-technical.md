# Technical SEO/GEO sprint - 8 November 2026

## Scope and evidence

Local source review of the 69 current indexable canonical pages, the 77-page validation corpus, routing/discovery generator and Knowledge compiler. Production publication and deployed checks belong to the root release task. No provider settings, customer records, CRM, payment rules or runtime form behavior were changed by this work.

The starting indexable corpus has one H1 per page, no skipped heading levels, one canonical URL and a nonempty description on every page. Blanket heading rewrites would add churn without fixing an observed issue. Navigation fragments and intentionally nonindexed pages are not editorial landing pages and are excluded from this assertion.

## Implemented

- Replaced the global July 2026 sitemap date fallback and stale root/application dates with an explicit, source-backed date record. Main-content fingerprints ignore whitespace and generated head metadata; a changed or unknown body has no `lastmod` until a verified date is supplied. An omitted optional date is more accurate than an invented date. This avoids build-time freshness inflation.
- Knowledge article and collection dates now derive from published article `updatedAt` values, with topic and long-read filtering. The Knowledge home, topic directories and article index no longer claim an unrelated July date after new publication.
- Aligned the shared Organization description and LLM guides with the approved identity homepage: a growing ecosystem rooted in Panama, with existing programmes and a School preparing for beta. It does not claim a launched School platform, automatic membership or proven universal-knowledge retrieval.
- Article JSON-LD now links to the actual Knowledge collection and topic. Sharing metadata identifies articles as `og:type=article`. Existing named/organizational authors and reviewers remain unchanged.
- Added pure date-validation and generated-discovery regression tests. Dates cannot rely on filesystem mtimes or the build clock; invalid date records fail closed.

## Date maintenance

`config/discovery-page-dates.json` records verified significant main-content updates, not a refresh time. When approved main content changes, replace the matching SHA-256 and date with the actual editorial update date and commit/source evidence. If no date is supported, leave the route unrecorded. Knowledge articles continue to use their existing validated frontmatter dates.

The fingerprint deliberately excludes the generated head block, so rerunning discovery does not mark every page as new. Changing a text, media, link or layout element within the main landmark invalidates a prior record until reconciled. This is conservative: metadata-only changes are not treated as fresh editorial content.

## Schema review boundaries

JSON-LD is present directly in the indexable HTML, not delayed until a client-side script executes. The existing graph reuses Organization, founder Person and WebSite identities, and preserves real Knowledge breadcrumbs. Known public Instagram and Trustpilot profiles remain the only Organization `sameAs` links; no invented Wikipedia, credentials, address, opening hours, awards, ratings or third-party endorsements were added.

The January event keeps its approved exact-case canonical path and 18-24 January 2027 dates. Its final venue is not confirmed, so no invented event location was added. A generic logo or imagined location was not added as an editorial article photograph just to satisfy a scoring checklist. Images, self-serving ratings, and rich-result eligibility need appropriate visible evidence, not decorative schema.

## Remaining checks and limits

- Root must run the generators, full tests and public-build inventory, then confirm deployed sitemap/Markdown/content in protected staging and production.
- Search/AI crawling, indexing and citation cannot be guaranteed by valid metadata. No ranking, citation rate or field Core Web Vitals claim is made here.
- Screen-reader, physical-device and independent legal/privacy reviews remain distinct human review gates; local structural tests do not certify them.
- Nonindexed payment-confirmation and maintenance routes do not receive new public schema or sitemap entries.
- If the root performance work changes an approved main landmark, refresh a backed date record or accept its intentional omission before release.

## Source guidance

Google's [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) says existing SEO fundamentals remain applicable and no special AI text file or schema is required. The existing Markdown/LLM guides are useful alternate representations, not eligibility requirements or guarantees.

OpenAI's [crawler documentation](https://developers.openai.com/api/docs/bots) separates OAI-SearchBot search crawling from GPTBot training. Current robots rules allow them independently. No training-policy expansion was made in this sprint.

The geo-technical and geo-schema skills guided the inventory and schema checks. Their heuristic scoring and broad citation-probability claims were not treated as measured results; the report records observable coverage instead.

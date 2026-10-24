# GEO production release — 24 October 2026

## Authorization and scope

James explicitly requested **“push to production”** after the protected GEO staging handoff. PR #174 promotes staging `44f942dde29f080fb2dff74b79baa49730cc60eb`; latest production main was already its ancestor. The production merge tree is identical to the verified staging candidate.

- Staging change: https://github.com/spiritofjames/Rainbow-Sanctuary/pull/173
- Production promotion: https://github.com/spiritofjames/Rainbow-Sanctuary/pull/174
- Production commit: `53b950ea4569610c7c7fee925cc095519a44191d`
- Merged: 2026-10-24 13:35:13 UTC
- Vercel: `dpl_Brv5u2Ph2zrJxSn6HtXweNEqm4fF`, Ready on `rainbowsanctuary.life`
- Rollback: `43240a8abc5efdecfd4ae411e18f9f5b04660d1d` / `dpl_Hg4HWSTyJKLR6Aas2Ny9gAj5QpDm`

## Evidence

Fresh candidate preflight passed: 252 tests (zero failed/skipped), 27 email templates and 27 disabled automation contracts, 25 release-critical files, 66 HTML pages, and 358 packaged public files. Discovery generation left the worktree unchanged. GitHub required checks passed; no unresolved review conversations. Independent read-only audit found no blocking code issue or missing public static reference, and confirmed native API/email imports remain available to function tracing.

After deployment, GitHub Site quality and Endpoint health both passed for the exact production commit. The live production alias resolves to the Ready deployment above.

### Public HTTP checks — 130 passed

- All 58 indexable canonical HTML routes: 200, nonempty title, correct canonical, no accidental noindex.
- All 59 public Markdown files including directory: 200, text/markdown, H1 present, no unresolved template expressions; canonical response links on the 58 page mirrors. Their noindex headers intentionally keep HTML as the indexed canonical representation.
- Sitemap: 200, 58 URLs. Robots, llms.txt, llms-full.txt, Pagefind runtime and guardian interface: 200.
- llms.txt links the public Markdown directory; December retreat Markdown retains December 2026 and USD 3,500 facts.
- Source-path HEAD probes: draft editorial template, audit documentation, test source, publishing script and package.json all 404. No private body retrieved.
- Native `/api/crm/intake` GET: 405 Method not allowed; no submission.
- Legacy retreat `.dc.html` route: 308 to its clean canonical route.
- HTTPS/HSTS present. Anonymous staging remains 302-protected; no access settings changed.

The first ad-hoc HTTP assertion incorrectly expected a Markdown H1 at byte zero. Generated files correctly begin with Source attribution and can include an eyebrow before the H1. The verification script was corrected to check an actual H1 line and rerun: all 130 checks passed. No production code change was needed.

### Browser checks

- Homepage at 1280×900 and 390×844: no horizontal overflow; no broken loaded images; truthful Trustpilot profile link visible.
- Homepage retreat link reaches the December page. Mobile retreat is 390px without horizontal overflow. The only zero-width image is the intentionally empty, hidden lightbox placeholder, not a failed asset.
- “Request a discovery call” computes white (`rgb(255, 255, 255)`) and underlined.
- Clicking it opens `/apply?reason=events&program=awakening-inner-light-december-2026&intent=discovery-call`; pathway and intent select correctly, December message is prefilled and consent remains unchecked. Form fits at 390px. No form submitted.
- No participant/Spotify iframe loaded during this check. Existing media behavior was not changed.

Local screenshots, sanitized HTTP results and the reproducible verifier are retained in the owner's project at `output/geo-production-2026-10-24/`. No credential, cookie or temporary QA access URL is included in this repository record.

## Review limits and follow-ups

This is scope-specific technical acceptance, not certification that every historical programme-wide Phase 4 item has been completed. Human privacy/legal, accessibility and physical iOS/Android reviews were not newly supplied; the previously recorded owner-accepted review exceptions remain explicit. Existing payment, CRM/email behavior and provider configuration were not changed or exercised with new writes.

No field LCP/INP/CLS, real transfer savings, Search Console coverage or actual AI citation result is asserted. The source-level scheduling improvements and discovery conventions are documented in `docs/GEO-AUDIT-REPORT.md`.

Pre-existing Knowledge search excerpts display literal `<mark>` tags. Search and canonical result routing work. Follow-up owner: James/Codex; no date committed. No rollback was needed. The rollback candidate predates source containment and would restore that exposure, so a reviewed forward fix is preferable unless severity demands otherwise.

This documentation-only branch includes production main ancestry and is merged into staging through a protected PR, without another production promotion.

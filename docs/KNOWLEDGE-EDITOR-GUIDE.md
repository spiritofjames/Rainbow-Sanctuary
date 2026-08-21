# Rainbow Sanctuary knowledge editor guide

## Editorial boundary

Only approved public articles are compiled. Drafts, archived entries, source IDs, consent records, review notes, local paths, and unpublished text never enter public pages, Pagefind, the sitemap, feeds, or knowledge index.

`Publish` in Sveltia CMS means submit a GitHub editorial-workflow change for the protected `staging` branch. It never publishes directly to production.

## Editor access

An editor must be an approved collaborator on `spiritofjames/Rainbow-Sanctuary` and use a fine-grained GitHub personal access token restricted to that repository. Grant only the minimum repository contents and pull-request permissions needed by the CMS. Do not paste a token into source files, issues, chat, or an untrusted browser.

The editor is available at `/guardian`. It is deliberately excluded from public discovery. The route name reduces casual discovery but is not an authentication control; the approved GitHub token remains mandatory. If the token is revoked, access stops until the editor signs in with a new approved token.

## Article lifecycle

1. Create the article as `draft`.
2. Add only opaque private source IDs—not source files, paths, secrets, or confidential notes.
3. Check the title, answer-first summary, topic, dates, and all internal references.
4. Use `sensitive-health` only when the required review is complete; otherwise keep the article out of approval.
5. Submit through the CMS editorial workflow. The resulting GitHub pull request must target `staging`.
6. A reviewer verifies scope, consent, factual support, voice, and safety before approval.
7. The protected staging build runs the compiler, Pagefind, discovery, static validation, and release integrity checks.
8. Production remains a separate `staging` to `main` release decision by James.

## Content rules

- Begin article body sections at Heading 2.
- Do not use raw HTML, embedded forms, iframes, scripts, object embeds, `javascript:` links, or private URLs.
- Do not diagnose, prescribe, claim a cure, invent credentials, use fabricated proof, or apply urgency language.
- Personal stories, direct quotes, and identifying images require a valid consent record ID before approval.
- If an article is no longer current, archive it and make a redirect-or-gone decision before release.

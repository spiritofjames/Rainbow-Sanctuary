# Rainbow Sanctuary deployment workflow

## Environments

| Environment | Git branch | URL | Access |
| --- | --- | --- | --- |
| Pull-request preview | Feature branch | Vercel-generated URL | Vercel authentication |
| Staging | `staging` | `https://staging.rainbowsanctuary.life` | Vercel authentication |
| Production | `main` | `https://rainbowsanctuary.life` | Public |

## Normal change

1. Create a short-lived branch from `staging`.
2. Make one focused change.
3. Run `node scripts/publish-discovery-layer.mjs` after changing public pages,
   navigation, events, or route metadata. Commit its generated output.
4. Run `python3 scripts/validate_site.py`.
5. Open a pull request into `staging`.
6. Wait for `Site quality` and the Vercel preview to pass. The quality gate reruns
   the discovery generator and fails if generated files were not committed.
7. Review the protected preview on desktop and mobile.
8. Resolve all review conversations.
9. Merge into `staging`.
10. Perform acceptance testing at the staging URL, including a clean path and its
    corresponding legacy `.dc.html` redirect.

Do not push directly to `staging` or `main`.

Do not run `vercel --prod` from a laptop, temporary directory, or uncommitted
worktree. It bypasses the review trail and can replace the live site with an
older local snapshot. An emergency production release still starts as a Git
commit and pull request. Vercel's Git integration promotes only the verified,
protected `main` branch to the public production domain.

## Canonical routes and discovery files

`scripts/publish-discovery-layer.mjs` is the source-controlled publishing step for:

- 36 clean canonical routes and permanent legacy redirects;
- canonical, robots, Open Graph, Twitter, image, and JSON-LD metadata;
- `sitemap.xml`, `robots.txt`, `llms.txt`, and `llms-full.txt`;
- clean internal navigation links; and
- Vercel rewrites, redirects, and required security headers.

Do not hand-edit generated discovery blocks or replace `vercel.json` with a version
that omits the security headers.

## Production promotion

1. Complete every required item in
   `docs/PHASE-4-STAGING-ACCEPTANCE.md`, attach evidence, and record each named
   approval. An incomplete checklist means `NO-GO`.
2. Record the current production deployment and commit as the rollback target.
3. Open a pull request from `staging` to `main`.
4. Complete every production item in the pull-request template.
5. Resolve every review conversation.
6. The release owner merges the pull request.
7. Watch the Vercel production deployment until it is Ready.
8. Verify the homepage, clean routes, one legacy redirect, navigation, sitemap,
   robots, LLM discovery files, primary calls to action, legal pages, and HTTPS.
9. Add the release to `docs/RELEASE-LOG.md`.

Merging the `staging` → `main` pull request is the explicit production approval.

## Production guardrails

- `main` is protected: changes require the `validate-static-site` GitHub check,
  no force pushes, and resolved review conversations.
- The quality workflow runs unit tests, the email-template check, static-page
  validation, discovery-layer reproducibility, and the release-integrity check.
- The release-integrity check fails if the favicon, critical public pages,
  payment/intake endpoints, or the Maintenance reminder cron are absent.
- Production is deployed from the immutable commit checked out by GitHub
  Actions—not from an agent or developer's local filesystem.
- Every production promotion is recorded in `docs/RELEASE-LOG.md` with its
  commit and prior deployment, so an intentional rollback target is explicit.

## Ownership

- Release owner: James (`@spiritofjames`)
- Content and operational acceptance: assigned Rainbow Sanctuary team reviewer
- Legal, safeguarding, payment, and privacy claims require the appropriate human
  reviewer. Automated checks and AI agents cannot provide those approvals.

## Emergency change

Emergency work still uses a pull request. Branch from `main`, make the smallest
possible fix, validate it in the Vercel preview, merge to `main`, and immediately
merge the same commit back into `staging` to prevent branch drift.

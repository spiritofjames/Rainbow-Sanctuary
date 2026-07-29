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
3. Open a pull request into `staging`.
4. Wait for `Site quality` and the Vercel preview to pass.
5. Review the protected preview on desktop and mobile.
6. Resolve all review conversations.
7. Merge into `staging`.
8. Perform acceptance testing at the staging URL.

Do not push directly to `staging` or `main`.

## Production promotion

1. Confirm staging acceptance is complete.
2. Record the current production deployment and commit as the rollback target.
3. Open a pull request from `staging` to `main`.
4. Complete every production item in the pull-request template.
5. Resolve every review conversation.
6. The release owner merges the pull request.
7. Watch the Vercel production deployment until it is Ready.
8. Verify the homepage, navigation, primary calls to action, legal pages, and HTTPS.
9. Add the release to `docs/RELEASE-LOG.md`.

Merging the `staging` → `main` pull request is the explicit production approval.

## Ownership

- Release owner: James (`@spiritofjames`)
- Content and operational acceptance: assigned Rainbow Sanctuary team reviewer
- Legal, safeguarding, payment, and privacy claims require the appropriate human
  reviewer. Automated checks and AI agents cannot provide those approvals.

## Emergency change

Emergency work still uses a pull request. Branch from `main`, make the smallest
possible fix, validate it in the Vercel preview, merge to `main`, and immediately
merge the same commit back into `staging` to prevent branch drift.

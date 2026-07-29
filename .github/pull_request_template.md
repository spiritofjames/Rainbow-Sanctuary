## Purpose

Describe the user-facing change and why it is needed.

## Target

- [ ] Feature branch → `staging`
- [ ] `staging` → `main` production promotion

## Verification

- [ ] Automated site-quality checks pass
- [ ] Desktop pages reviewed
- [ ] Mobile pages reviewed
- [ ] Navigation, forms, and primary calls to action tested
- [ ] Clean routes, legacy redirects, sitemap, robots, and discovery metadata tested
- [ ] Discovery generator was run and all generated changes are committed
- [ ] No placeholders, internal notes, or test URLs are exposed
- [ ] Staging deployment reviewed at `staging.rainbowsanctuary.life`

## Production promotion only

- [ ] Team acceptance testing is complete
- [ ] Legal, safeguarding, pricing, payment, and event information is confirmed
- [ ] Rollback target is recorded
- [ ] Release owner explicitly approves the merge

## Rollback

Record the last known-good Vercel deployment or Git commit:

`____________________________`

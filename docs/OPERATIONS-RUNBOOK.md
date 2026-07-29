# Website operations runbook

## Service objectives

- Production availability target: 99.9% per calendar month.
- Critical pages must return a valid HTTPS response.
- `www` must permanently redirect to the apex domain.
- Staging must remain behind Vercel authentication.
- Recovery target: restore the last known-good deployment within 30 minutes.

## Monitoring

GitHub Actions runs `Endpoint health` twice per hour and checks:

- production DNS, TLS, root routing, and representative clean routes;
- a representative legacy `.dc.html` permanent redirect;
- `sitemap.xml`, `robots.txt`, and `llms.txt`;
- the permanent `www` canonical redirect;
- staging DNS, TLS, and Vercel authentication protection.

GitHub records every run. A failed scheduled workflow is the initial incident
signal. The release owner should enable GitHub Actions failure notifications.

## Deployment failure

1. Do not retry repeatedly.
2. Open the failed Vercel deployment and read the build log.
3. Confirm whether production still serves the previous deployment.
4. Fix the problem on a feature branch and repeat the normal staging path.
5. If production was affected, use the rollback procedure below.

## Endpoint-health failure

1. Run `python3 scripts/check_endpoints.py` locally.
2. Check Vercel status and the project deployment page.
3. Confirm Namecheap still has the approved A and CNAME records.
4. Confirm the domain has a valid certificate in Vercel.
5. Determine whether the failure is production-only, staging-only, or DNS-wide.
6. Record the start time, observed impact, owner, and actions taken.

## Rollback

Preferred rollback uses Vercel's immutable deployment history:

1. Open the production project in Vercel.
2. Find the last deployment that passed acceptance testing.
3. Inspect its commit, date, and deployment URL.
4. Use Vercel's production promotion/rollback control to restore it.
5. Verify the production homepage, representative clean routes, legacy redirect,
   sitemap, robots file, LLM discovery file, and critical journeys.
6. Revert the faulty Git commit through a pull request so Git matches production.
7. Record the rollback in `docs/RELEASE-LOG.md`.

Do not rewrite Git history, force-push, or delete protected branches.

## Escalation

- Critical: production unavailable, certificate invalid, domain hijack concern, or
  a harmful/legal/safeguarding error. Owner responds immediately.
- Warning: staging unavailable, monitoring failure without confirmed user impact,
  or a non-critical broken page. Owner responds during the working day.
- Informational: successful deployment or planned content release.

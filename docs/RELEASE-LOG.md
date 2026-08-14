# Release log

## 2026-08-15 — Production recovery and release safeguards

- **Release owner:** James / Rainbow Sanctuary team
- **Pull requests:** #74 (recovery to staging), #75 (recovery to production), #76 (release contract and navigation safeguard)
- **Production commit:** `cb22efe456e378a2b5ef379c7d97828c75b8edf5`
- **Summary:** Restored the branded favicon and the ReGeneration Maintenance reminder function; re-established GitHub `main` as the production source of truth; and verified Vercel's native Git deployment path.
- **Safeguards added:** Protected-branch review and quality gates, a release-integrity contract for the favicon, navigation structure, key public pages and server endpoints, plus protection against the discovery publisher removing the Monday reminder cron.
- **Verification:** Application tests, email-template validation, release-integrity validation, static-site validation, Vercel production inspection, and public endpoint checks passed.
- **Rollback required:** No.

Record production promotions and rollbacks here. Newest entry first.

## Template

- Date:
- Release owner:
- Pull request:
- Production commit:
- Previous deployment/rollback target:
- Summary:
- Verification:
- Rollback required: No

# 01_website — govern the public website workflow

One job: route approved website work through research, implementation, and release
review without moving the existing deployment-sensitive root source files.

## Inputs
- Working: the approved task and exact root source/test paths.
- Reference: `../README.md`, `../docs/`, and `../_shared/`.

Do NOT load: unrelated worktrees, credentials, private CRM data, or prior raw runs.

## Process
1. Select one role contract under `roles/`.
2. Claim exact files in Continuum and perform the bounded task.
3. Write the declared source, test, or evidence output.

## Outputs
- Existing canonical root source/tests, or a role-scoped report under `roles/*/output/`.

## Run boundary
- Default: complete one role task and return for review.
- Resume when: the role gate passes and the next dependency is approved.
- Parallel-safe with: independent read-only roles or separate source file sets.
- Never run in parallel with: shared writers, provider configuration, or release promotion.

## Human check
- Reviewer: James or the authorized website/release owner.
- Decision: approve, revise, or stop before downstream or production work.

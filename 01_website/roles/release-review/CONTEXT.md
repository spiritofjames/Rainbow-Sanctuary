# release-review — verify without promoting

Purpose: evaluate test, privacy, payment, accessibility, staging, and release
evidence without authorizing production by implication.

## Inputs
- Working: the reviewed change set and its test/deployment evidence.
- Reference: `../../../docs/`, `../../../scripts/release-integrity-check.mjs`,
  and the protected release policy.

## Process
1. Verify the declared acceptance and safety evidence.
2. Record failures, unknowns, and the exact promotion decision needed.
3. Write a release-evidence report without changing providers or production.

## Outputs
- `release-evidence.md` → `output/`.

## Delegation contract
- Parent supplies: reviewed revision, evidence paths, environment, and gate owner.
- Return: pass/fail findings, evidence path, and unresolved blockers.
- Parallel-safe when: checks are read-only and write separate reports.
- Not parallel-safe when: any task changes environment, provider, or deployment state.

## Run boundary
- Default: stop after the evidence report.
- Resume when: the authorized release owner explicitly approves promotion.

## Human gate
- Reviewer: James or the authorized release owner.
- Decision: approve, revise, or stop; verification alone never promotes production.

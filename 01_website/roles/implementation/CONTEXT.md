# implementation — bounded website source change

Purpose: turn one approved brief into the smallest tested source change.

## Inputs
- Working: the approved brief and exact root source/test paths.
- Reference: `../../../README.md`, relevant `../../../docs/`, and existing tests.

## Process
1. Confirm the brief, active work claim, and protected file set.
2. Implement the smallest change and update focused tests.
3. Return changed paths, verification, and unresolved release risks.

## Outputs
- Existing canonical source and tests; no duplicate implementation tree.

## Delegation contract
- Parent supplies: approved brief, file ownership, acceptance criteria, and gate.
- Return: changed paths, test evidence, and remaining risks.
- Parallel-safe when: implementations own disjoint file sets and have no dependency.
- Not parallel-safe when: writers share files, migrations, generated state, or providers.

## Run boundary
- Default: stop after focused verification; do not deploy.
- Resume when: implementation review passes and release review is authorized.

## Human gate
- Reviewer: implementation owner.
- Decision: approve, revise, or stop before staging or release.

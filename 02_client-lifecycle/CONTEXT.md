# 02_client-lifecycle — approved human-reviewed communications

One job: prepare or implement one approved lifecycle communication within privacy,
consent, delivery, and service boundaries.

## Inputs
- Working: the approved lifecycle task and exact `../emails/` or API paths.
- Reference: relevant `../docs/`, privacy policy, and approved offer taxonomy.

## Process
1. Confirm audience, consent, purpose, and delivery boundary.
2. Prepare the bounded content or implementation with focused tests.
3. Return evidence without sending unless the explicit delivery gate is approved.

## Outputs
- Existing canonical email/API source and tests, or a scoped review artifact.

## Run boundary
- Default: stop after content/implementation review; do not send.
- Resume when: content, privacy, consent, and delivery gates are approved.
- Parallel-safe with: independent read-only content checks with separate outputs.
- Never run in parallel with: shared writers, recipient mutation, provider activation, or sending.

## Human check
- Reviewer: authorized content/privacy/delivery owner.
- Decision: approve, revise, or stop before any external message or lifecycle effect.

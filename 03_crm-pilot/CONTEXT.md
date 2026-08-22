# 03_crm-pilot — governed PSN CRM integration boundary

One job: route an approved capability or handoff question to the PSN Relationship
Hub without duplicating CRM source, data, agents, or authority in this repository.

## Inputs
- Working: the approved capability question or handoff contract.
- Reference: the current PSN Relationship Hub `WORKSPACE.md` and stage gate
  supplied by the parent PSN workspace.

Do NOT load: CRM source, contact data, credentials, or provider configuration unless
the PSN CRM contract and an active ownership claim explicitly authorize it.

## Process
1. Confirm the PSN CRM task, project key, active work, and current gate.
2. Produce a scoped requirement, handoff, or evidence request.
3. Return to the CRM human gate; do not implement a duplicate local CRM.

## Outputs
- A scoped handoff or decision artifact; canonical CRM changes remain in the CRM repository.

## Run boundary
- Default: stop at the handoff or decision artifact.
- Resume when: the PSN CRM owner approves the relevant sprint or external-effect gate.
- Parallel-safe with: independent read-only requirements work with separate outputs.
- Never run in parallel with: CRM writers, real-data work, sends, payments, providers, or release.

## Human check
- Reviewer: PSN CRM accountable owner.
- Decision: approve, revise, or stop before CRM implementation or external effects.

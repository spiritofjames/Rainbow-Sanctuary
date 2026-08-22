# Rainbow Sanctuary

Model-neutral ICM umbrella for the Rainbow Sanctuary public website, approved
client-lifecycle work, and the governed PSN CRM integration boundary. Existing
flat site files remain in place because they are deployment-sensitive source.

## Form

Umbrella with three child contracts: website, client lifecycle, and CRM pilot.

## Route

| If the task is | Go to |
|---|---|
| Site content, code, tests, accessibility, or release | `01_website/CONTEXT.md` |
| Approved email or lifecycle coordination | `02_client-lifecycle/CONTEXT.md` |
| CRM capability, handoff, or roadmap | `03_crm-pilot/CONTEXT.md` |
| Stable governance and memory policy | `_shared/` |
| Current repository behavior | `README.md` and the relevant source/test files |

## Runtime

Use Continuum project key `rainbow-sanctuary`: check active work, retrieve scoped
context, and claim exact files before editing. Read the selected child contract,
then only its declared inputs. Filesystem and deployment evidence determine status.

## Run policy

- Default scope is one child contract or one bounded role task, then its human gate.
- A longer run requires explicit user authorization and cannot bypass content,
  privacy, payment, safeguarding, CRM, provider, staging, or production gates.
- Independent roles may run in parallel only with separate inputs and output paths.
  Dependencies and shared writers remain sequential.
- Parallelism is a speed choice, not a guarantee of lower total token or review cost.

## Non-negotiable boundaries

- Preserve the protected staging-to-production release workflow.
- Keep sensitive intake, payments, credentials, and private CRM data out of local
  working artifacts unless an approved secure contract explicitly permits them.
- No autonomous sending, payment mutation, CRM write, safeguarding decision,
  provider activation, or production promotion.
- `AGENTS.md` and `CLAUDE.md` are compatibility pointers; this file is canonical.

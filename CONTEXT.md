# Rainbow Sanctuary task routing

## Choose the route

| Work | Contract | Status truth |
|---|---|---|
| Website | `01_website/CONTEXT.md` | source, tests, staging, and release evidence |
| Client lifecycle | `02_client-lifecycle/CONTEXT.md` | approved content and delivery evidence |
| CRM integration | `03_crm-pilot/CONTEXT.md` | PSN CRM contract and human gate |
| Persistent memory or ownership | Continuum | Continuum only |

## Execution rule

Load only the chosen contract and its declared inputs. Default to one bounded task.
Stop at its human gate unless the user explicitly authorizes a longer run and every
intervening privacy, payment, safeguarding, CRM, provider, or release gate passes.

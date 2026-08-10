# Supported Group Pathways — approved implementation design

**Status:** approved for protected-staging implementation on 10 August 2026.
**Canonical scheduling time zone:** Beijing, `Asia/Shanghai` (UTC+8). All dates are authored there and rendered in the visitor's local zone.

## Pathways

| Pathway | Delivery | Entry | Financial model | Initial schedule |
|---|---|---|---|---|
| Autism & family support | Scheduled remote practice; no live attendance or Zoom at launch | Direct registration; guardian confirmation for under-18s | Participation is free; optional contribution is separate and never controls access | Tuesdays, 23:00 Beijing |
| Young people’s emotional wellbeing support (up to 25) | Scheduled remote practice; no live attendance or Zoom at launch | Application and human review | Participation is free; optional contribution is separate and never controls access | First Tuesday monthly, 23:00 Beijing |
| 144 Stages maintenance | Scheduled remote maintenance; no Zoom at launch | Private accepted participants only | USD 50 fixed price, after acceptance | Mondays, 23:00 Beijing, starting 17 August 2026; weekly for the first 13 sessions |

At 23:00 Beijing, the autism/young-person sessions are 22:00 in Vietnam/Jakarta and 10:00 same-day in Panama. The 144 sessions follow the same source-time convention. Indonesia must never be displayed as a single time zone: Makassar/Bali is 23:00 while Jakarta is 22:00.

## Public boundaries

- Public descriptions use **support**, **wellbeing**, and **scheduled practice**; they do not promise to heal autism, treat depression, or create clinical outcomes.
- The young-person pathway is not medical treatment, crisis care, or a substitute for licensed support. It has a human review/safeguarding gate before registration.
- No medical records, diagnoses, emergency information, or third-party information are collected. A photo is never required for the public support pathways. Any optional photo intake remains a separately consented private-healing workflow.
- The autism pathway needs adult self-registration or guardian confirmation for participants under 18; the young-person pathway needs the appropriate adult/guardian consent flow before a human review can approve an under-18 participant.

## Payment and contribution architecture

1. Registration is recorded first, without requiring a payment method.
2. The visitor may then choose an entirely optional contribution. Suggested amounts are USD 10, 25, 50 and 100, with a custom amount only when Stripe/legal-entity rules permit.
3. Contributions use a distinct Stripe product/Checkout flow. They do not create programme entitlement, cannot be represented as charitable/tax-deductible, and cannot block access.
4. The USD 50 144 payment is a fixed-price accepted-participant checkout. A signed, expiry-bound invitation is issued only after the team confirms the participant, exact session and terms.
5. Stripe is financial authority; the operations/CRM layer is the operational mirror. Webhook verification is required before confirmation emails or access details are sent.

## Events, operations and messages

- The public Events page shows only approved public sessions. 144 is not public by default.
- Recurrence generator emits stable IDs from path + Beijing start time. It never exposes participant identities.
- Private operations calendar receives the scheduled event, but visitors are not Calendar attendees for non-live sessions.
- Email lifecycle: registration received → pre-session preparation/reminder → session complete → optional contribution request (where approved). For 144, payment received must precede the session reminder.
- Future live sessions use the same model with `deliveryMode: live_zoom`; the official Ethel Zoom host is created only after a session is formally marked live.

## Required approval gates before public activation

| Gate | Owner | Required decision |
|---|---|---|
| safeguarding and escalation runbook | Stephanie + designated safeguarding lead | review workflow, age/guardian policy, emergency/crisis route |
| public wording | Stephanie + legal/clinical review as appropriate | approved non-clinical claims and disclaimers |
| Stripe contribution classification | legal entity / finance owner | account country, tax and permitted contribution language |
| 144 post-three-month rule | Stephanie | exact twice-monthly recurrence dates after 9 November 2026 |
| operational ownership | Ethel + Stephanie | queue SLA, message owner and participant preparation text |

Implementation may render the pages and staging operations structure, but fail-closes public registration, contributions and payments until the applicable gate is recorded as approved.

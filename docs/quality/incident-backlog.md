# Reliability incident backlog

This is Rainbow Sanctuary's operational learning record for website, registration, payment, calendar, CRM, and email failures. It is deliberately free of customer data, payment details, access tokens, and private health or family information.

Active incidents are tracked as GitHub Issues. The scheduled production monitor opens one issue for a public-site outage and adds a comment if the same issue recurs, so the backlog remains readable rather than creating duplicates.

## How an incident enters the backlog

1. The automated production monitor detects an unhealthy public route and opens or updates an `[Incident]` GitHub Issue.
2. A team member creates a **Production incident** issue from the repository template when they notice a form, payment, calendar, HubSpot, Zoom, or email problem.
3. The owner records the user impact, evidence, root cause, fix, and regression proof before closing it.
4. Any prevention lesson that applies beyond the individual issue is added below.

## Priority guide

| Priority | Meaning | Response expectation |
| --- | --- | --- |
| P0 | Payments, registrations, or private information are at risk, or the public site is unavailable. | Stop the affected flow, investigate immediately, and verify a fix before reopening it. |
| P1 | A core journey is broken for a meaningful group of visitors. | Investigate the same working day and add a regression check. |
| P2 | A non-blocking defect, confusing copy, or operational friction. | Schedule in the next maintenance cycle. |
| P3 | Improvement idea with no demonstrated user impact. | Keep visible for prioritisation. |

## Required closure record

Every closed incident must state:

- What visitors or staff experienced, and when it started.
- How it was detected (monitor, automated test, staff report, or customer report).
- The technical root cause, without sensitive data.
- The change or pull request that fixed it.
- The automated regression check, smoke check, or manual release step that now prevents recurrence.
- Confirmation that production was checked after release.

## Known reliability lessons

| Lesson | Prevention now in place |
| --- | --- |
| Interactive payment buttons can fail after client-side rendering changes. | Checkout and offer-contract tests run in the required preflight; payment links are opened through Stripe rather than reconstructed in the browser. |
| A paid registration must create one identifiable operational record, even if provider delivery is delayed. | Payment, HubSpot, booking-email, and webhook tests are part of every preflight; follow-up retries must remain idempotent. |
| Creating a new calendar event per attendee produces duplicate host events. | The host series is the source event; attendees are added to that event with guest permissions restricted. Calendar tests cover the series contract. |
| Form submission failures can leave a visitor uncertain whether a registration was saved. | Intake tests cover server failure handling, and the UI must show a clear saved/not-saved result rather than a generic success message. |
| Group-event confirmations need event-specific wording and access details, not a private-session follow-up message. | Group-healing booking-email tests cover the confirmation and reminder content separately from private-intake flows. |

## Current quality controls

- `npm run quality:preflight` validates generated knowledge, automated tests, email configuration, release integrity, static validation, discovery files, and deployment configuration; CI also runs `npm run quality:generated-check` from a clean checkout to ensure generated artifacts are committed.
- Pull requests and pushes to `staging` and `main` run the same preflight in GitHub Actions.
- The production smoke monitor runs twice an hour, checks the public routes that lead into current core journeys, and creates or updates an incident issue when a check fails.
- Provider actions that could charge, email, or create customer records are not run by the public smoke monitor. They require a deliberate no-charge release test using approved test data.

# Protected staging private-intake repair

Owner-approved repair following the 3 November 07:26 Panama form failure.

## Confirmed cause

The deployed handler logged `hubspot-private-configuration`, before HubSpot,
emails or payment navigation. Staging is a custom Vercel environment, not the
generic Preview environment. It lacked explicit private-intake enablement and
retention bindings even though generic Preview/Production entries existed.

## Scoped correction

The owner approved **protected staging only**:

- `HUBSPOT_PRIVATE_INTAKE_ENABLED=true`
- `HUBSPOT_PRIVATE_INTAKE_TTL=P30D`

Both settings are bound only to custom staging environment
`env_5OTQgYeUBJ6Qdwtywz53ua9AAmCA`. No credentials, email-recipient restrictions,
access protection, production settings or original-homepage content are changed.

The handler now reports missing/disabled service configuration as HTTP 503,
not invalid customer input (400). It stays fail-closed: no payment link on
failure. The form's 503 message asks the visitor to keep the page open, retains
their entered values and photo, and no longer suggests retyping valid fields.
Regression tests cover the actual missing-private-flag failure before any
provider calls, plus client preservation of entered data/no payment redirect.

Full local quality preflight passed: **275 tests**, 28 email contracts, 66 HTML
pages, 59 discovery routes, 358 public-build files and release-integrity checks.
The original homepage, USD 500 price, payment URL and simplified fields are
unchanged by this repair.

## Verification boundary

Synthetic tests do not certify live HubSpot storage, email delivery or Stripe
payment fulfillment. A fresh owner-approved QA submission is needed for live
form confirmation. Do not resubmit the owner's filled form, accept agreements,
send QA records/emails or make a charge without the applicable approval.

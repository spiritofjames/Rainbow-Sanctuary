# Stripe Checkout runbook

## Current scope

Protected staging creates Stripe-hosted Checkout Sessions for the USD 22 Group
Healing total and for the allowlisted standard programme variants in the governed
server catalogue. The browser sends only an offer/event identifier and disposable
request ID; the server owns the amount, currency, policy and quantity. Retreats,
private healing, certifications, unpriced programmes and early-bird variants
without an approved deadline remain closed. Their visible price is not Checkout
authority.

The advertised totals use an internal 4% + USD 0.50 payment-processing allowance
and are rounded up to a clear whole-USD price (nearest USD 5 for programme prices).
This is absorbed into one advertised total rather than added as a card surcharge.
It is not a statement of Stripe's exact fee for every card or market.

## Safety gates

- Preview and staging must use a Stripe sandbox secret key.
- An event must be both public with `status: "open"` and included in
  `STRIPE_ALLOWED_GROUP_EVENT_IDS`.
- Production also requires a live key and `STRIPE_LIVE_CHECKOUT_APPROVED=true`.
- Production additionally requires `STRIPE_AUTOMATIC_TAX_ENABLED=true` and
  `STRIPE_TAX_DISPLAY_APPROVED=true`. Do not set either until the operating
  entity, Stripe account country, tax registrations and product tax treatment
  have been reviewed.
- Live webhooks fail closed until the governed CRM event endpoint is configured.
- The CRM handoff contains only the client's full name and normalized email plus
  Stripe/object identifiers, the internal session and offer identifiers, amount,
  currency, and occurrence time. It excludes addresses, phone numbers, payment
  methods, card data, receipts, secrets, recovery codes, and API keys.

## Vercel environment variables

Use `.env.example` as the inventory. Store values in Vercel environment settings;
never put secrets into source code, GitHub, screenshots, chat, or client-side
JavaScript.

For staging, configure the variables for Preview only and include the exact staging
origin. Keep production variables unset until the production gate is approved.

## Sandbox acceptance

1. Open a confirmed test event by changing its public status to `open` and adding
   its identifier to the staging allowlist.
2. Select the session on staging and confirm Checkout shows the expected USD 22
   Group Healing product.
3. Complete a Stripe test-card payment.
4. Confirm the success return, Stripe receipt, signed webhook delivery, duplicate
   webhook idempotency at the CRM gateway, and no public Zoom link.
5. Test cancellation, declined payment, asynchronous failure where applicable,
   refund, duplicate delivery, and an event not on the allowlist.
6. Restore any synthetic event data before production promotion.

For each programme variant, repeat the same process and verify the exact
server-catalogue amount, programme/session identifiers, CRM association and
single programme-confirmation email. Early-bird variants remain unavailable until
the deadline and eligibility rule are approved.

## Group Healing terms

- Participant cancellation is non-refundable.
- The booking is non-transferable.
- One reschedule to another available Group Healing session is permitted when
  requested through `bookings@rainbowsanctuary.life` at least 24 hours before the
  booked session.
- A second change, late cancellation or no-show is not eligible for rescheduling.
- If Rainbow Sanctuary cancels and cannot offer a suitable replacement, the
  participant may choose a refund.
- Mandatory consumer and lawful card-dispute rights remain unaffected.

## Production gate

Do not enable live checkout until the operating legal entity and contact routes are
published, the privacy and terms pages name Stripe, the event capacity and Zoom
fulfillment owner are confirmed, the CRM payment event gateway has passed sandbox
tests, and the tax gates above are approved. Each programme also requires its own
schedule/fulfillment and cancellation/refund terms before its production offer ID
is allowlisted.

# Stripe Checkout runbook

## Current scope

The public website creates Stripe-hosted Checkout only for approved public
journeys: the confirmed USD 22 Group Healing session and the USD 50
Regeneration Maintenance Monday sessions. Other programme pages remain
enquiry-led and contain no public purchase button or programme Checkout entry
point.

After a human conversation, Ethel may send the participant the exact persistent,
signed staff payment link from the internal catalogue. It opens a fresh
Stripe-hosted Checkout for a fixed server-side offer. Standard and Early Bird are
separate links, so Ethel never edits an amount or uses a generic discount field.
The catalogue is internal and must not be published on the website. Retreats,
private healing and unpriced work remain outside it.

The advertised totals use an internal 4% + USD 0.50 payment-processing allowance
and are rounded up to a clear whole-USD price (nearest USD 5 for programme prices).
This is absorbed into one advertised total rather than added as a card surcharge.
It is not a statement of Stripe's exact fee for every card or market.

## Safety gates

- Preview and staging must use a Stripe sandbox secret key.
- A Group Healing event must be public with `status: "open"` and included in
  `STRIPE_ALLOWED_GROUP_EVENT_IDS`.
- A Regeneration Maintenance Monday must be public with `status: "open"` and
  included in `STRIPE_ALLOWED_REGENERATION_EVENT_IDS`.
- `STRIPE_ALLOWED_OFFER_IDS` contains only the explicitly approved public
  offer IDs (`group-healing,regeneration-maintenance`); guessed programme
  requests to the public endpoint fail closed.
- Staff payment invitations resolve to fixed server-side prices and governed
  offer/session metadata before opening Stripe-hosted Checkout.
  Ethel sends one only after confirming the person and option. Promotion codes,
  customer-adjustable amounts and quantities stay disabled.
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

For staging, configure the variables for the protected `staging` environment and
include the exact staging origin. Keep production variables unset until the
production gate is approved.

Generate the **test-mode** internal catalogue with the same invitation signing
secret stored in the protected staging environment. The generator does not need
or download the Stripe secret key:

```sh
PAYMENT_INVITE_SIGNING_SECRET="<protected staging value>" \
PAYMENT_INVITE_BASE_URL="https://staging.rainbowsanctuary.life" \
npm run stripe:payment-links -- \
  --output ../../output/ETHEL-PAYMENT-LINK-CATALOG.md
```

The script signs governed offer identifiers; it never exposes or embeds Stripe
credentials. A live base URL additionally requires
`STRIPE_PAYMENT_LINKS_LIVE_APPROVED=true`; do not set that gate until every
production condition below is accepted.

## Sandbox acceptance

1. Open a confirmed test event by changing its public status to `open` and adding
   its identifier to the matching staging allowlist.
2. Select the session on staging and confirm Checkout shows the expected USD 22
   Group Healing or USD 50 Regeneration Maintenance product.
3. Complete a Stripe test-card payment.
4. Confirm the success return, Stripe receipt, signed webhook delivery, duplicate
   webhook idempotency at the CRM gateway, and no public Zoom link.
5. Test cancellation, declined payment, asynchronous failure where applicable,
   refund, duplicate delivery, and an event not on the allowlist.
6. Restore any synthetic event data before production promotion.

For each staff-sent programme payment link, verify the exact catalogue amount,
programme/session identifiers, CRM association and single programme-confirmation
email. The Early Bird link may exist in the private catalogue, but Ethel must not
send it until its eligibility and deadline have been confirmed for that person.

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

Do not enable live Group Healing Checkout or issue live staff payment links until
the operating legal entity and contact routes are published, the privacy and terms
pages name Stripe, the event capacity and Zoom fulfilment owner are confirmed, the
CRM payment event gateway has passed sandbox tests, and the tax gates above are
approved. Each programme also requires its own schedule/fulfilment and
cancellation/refund terms before Ethel receives its live link.

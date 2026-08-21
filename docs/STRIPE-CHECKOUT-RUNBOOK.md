# Stripe Checkout runbook

## Current scope

The public website creates Stripe-hosted Checkout only for approved public
journeys: the confirmed USD 22 Group Healing session and ReGeneration
Maintenance commitments (USD 210 for four Mondays or USD 630 for the first
twelve-week cycle). Other programme pages remain
enquiry-led and contain no public purchase button or programme Checkout entry
point.

### ReGeneration Maintenance product catalogue

Create one live Stripe Product named **ReGeneration Maintenance — 144-Point
Renewal** with two fixed, one-time USD Prices:

- **USD 210** — one-month commitment (17 August–7 September 2026; four Mondays)
- **USD 630** — first three-month cycle (17 August–2 November 2026; twelve Mondays)

Copy the two **Price IDs** (`price_…`), not the Product ID (`prod_…`), into
the matching protected Vercel variables:

```text
STRIPE_REGENERATION_MAINTENANCE_MONTHLY_PRICE_ID
STRIPE_REGENERATION_MAINTENANCE_THREE_MONTH_PRICE_ID
```

When both are set, the website creates each fresh, Stripe-hosted Checkout
session from the persistent Price. The browser never receives a secret or an
amount it can alter. This also makes a Stripe promotion code restricted to this
Product valid for both commitments. Until the two variables are set, the legacy
server-owned dynamic-price fallback remains available so live payments are not
interrupted during the catalogue migration.

After a human conversation, Ethel may send the participant the exact persistent,
signed staff payment link from the internal catalogue. It opens a fresh
Stripe-hosted Checkout for a fixed server-side offer. Standard and Early Bird are
separate links, so Ethel never edits an amount or uses a generic discount field.
The catalogue is internal and must not be published on the website. Private
healing and unpriced work remain outside it; the approved October 2026 retreat
payment exception is governed below.

Stripe Dashboard Payment Links may also be used as an internal operations
fallback when a participant needs a simple reusable link. The approved October
2026 retreat page is a narrow exception: it may present its two fixed payment
links only to people who are already confirmed or personally invited, while new
participants continue through the application path. Every such link must be a
fixed, one-time price and be entered in
`STRIPE_STAFF_PAYMENT_LINK_MAP` as `plink_id:offer-id` before the link is ever
sent or published. That exact allowlist hydrates the verified Stripe webhook with the approved
offer/session identity; unlisted links are not treated as Rainbow programme
payments. Use the accompanying `ETHEL-PAYMENT-LINK-REGISTER.md` as the
operational register.

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
- A Dashboard Payment Link is permitted only when its ID is explicitly mapped to
  the same fixed offer in `STRIPE_STAFF_PAYMENT_LINK_MAP`, it requires customer
  name and email, and the total matches the server-owned catalogue exactly.
- Production also requires a live key and `STRIPE_LIVE_CHECKOUT_APPROVED=true`.
- Production additionally requires `STRIPE_AUTOMATIC_TAX_ENABLED=true` and
  `STRIPE_TAX_DISPLAY_APPROVED=true`. Do not set either until the operating
  entity, Stripe account country, tax registrations and product tax treatment
  have been reviewed.
- Live webhooks fail closed until the governed HubSpot payment mirror is enabled
  and configured. The legacy PSN CRM event gateway is a secondary signed mirror;
  its absence must not strand an otherwise verified payment in Stripe.
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
   Group Healing or the correct fixed ReGeneration Maintenance commitment.
3. Complete a Stripe test-card payment.
4. Confirm the success return, Stripe receipt, signed webhook delivery, HubSpot
   contact association, duplicate webhook safety, and no public Zoom link.
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
HubSpot payment mirror has passed sandbox tests, a post-payment Zoom fulfilment
owner is confirmed, and the tax gates above are
approved. Each programme also requires its own schedule/fulfilment and
cancellation/refund terms before Ethel receives its live link.

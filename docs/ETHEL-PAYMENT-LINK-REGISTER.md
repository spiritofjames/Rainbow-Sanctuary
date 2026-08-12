# Ethel — Programme Payment Register

Status: **internal operations only — do not place these links on public pages**

This register is the controlled fallback for a participant who has already
spoken with the Rainbow Sanctuary team and is ready to pay. The public website
continues to use its own scheduled Checkout journeys for Group Healing and
Regeneration Maintenance.

## How to use this register

1. Confirm the participant, exact programme, price tier, start/schedule and
   applicable cancellation terms.
2. Create or update the participant contact in HubSpot before sending payment.
3. Send only the matching secure payment link below.
4. After Stripe confirms payment, check that the payment is visible against the
   participant’s HubSpot contact before arranging fulfilment.
5. Never edit an amount in a message, create an informal discount, or send an
   Early Bird link without confirming eligibility and its deadline.

Each Stripe Dashboard link must be registered in the Production environment as
`STRIPE_STAFF_PAYMENT_LINK_MAP=plink_xxx:offer-id,...` **before** it is shared.
That allowlist makes the verified payment enter the right Rainbow Sanctuary
CRM, HubSpot contact, operations notification and participant confirmation flow.

## Current approved fee-inclusive totals

| Programme | Payment option | Total | Stripe Payment Link |
|---|---|---:|---|
| Spiral I — Foundations | Standard enrollment | USD 1,460 | Pending controlled live link |
| Spiral I — Foundations | Early Bird enrollment | USD 1,045 | Pending controlled live link |
| Spiral II — Relationships | Standard enrollment | USD 1,670 | Pending controlled live link |
| Spiral II — Relationships | Early Bird enrollment | USD 1,355 | Pending controlled live link |
| Spiral III — Direction | Standard enrollment | USD 1,670 | Pending controlled live link |
| Spiral III — Direction | Early Bird enrollment | USD 1,460 | Pending controlled live link |
| Spiral IV — Leadership | Standard enrollment | USD 1,670 | Pending controlled live link |
| Spiral IV — Leadership | Early Bird enrollment | USD 1,460 | Pending controlled live link |
| ReGeneration | Level I | USD 3,125 | Pending controlled live link |
| ReGeneration | Level II | USD 2,500 | Pending controlled live link |
| Earth Healer Training | Level I | USD 525 | Pending controlled live link |
| Earth Healer Training | Level II | USD 730 | Pending controlled live link |
| Crystal Healing | Programme payment | USD 940 | Pending controlled live link |
| Intuitive Perception Training | Programme payment | USD 940 | Pending controlled live link |
| Adult Potential Development | Programme payment | USD 1,670 | Pending controlled live link |
| Children’s Potential Coach Certification | Programme payment | USD 7,710 | Pending controlled live link |

## Stripe link configuration standard

- One-time USD price; quantity locked to one.
- Customer email and full name required; no shipping address or phone number
  unless a programme later requires it.
- Payment processing is included in the advertised total.
- Promotion codes disabled. Early Bird is a separate fixed-price link.
- Stripe-hosted receipt stays enabled.
- A successful payment redirects to Rainbow Sanctuary’s verified payment
  confirmation page.
- Support contact: `payments@rainbowsanctuary.life`.

The existing optional-contribution link is separate and is not included in this
programme register.

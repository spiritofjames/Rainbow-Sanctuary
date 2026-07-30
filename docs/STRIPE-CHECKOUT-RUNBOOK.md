# Stripe Checkout runbook

## Current scope

The website creates Stripe-hosted Checkout Sessions only for the USD 20 Group
Healing offer. The browser sends an event identifier; the server owns the Stripe
Price ID and quantity. Higher-value programs, certifications, and retreats remain
application-led and are not exposed as direct Checkout products.

## Safety gates

- Preview and staging must use a Stripe sandbox secret key.
- An event must be both public with `status: "open"` and included in
  `STRIPE_ALLOWED_GROUP_EVENT_IDS`.
- Production also requires a live key and `STRIPE_LIVE_CHECKOUT_APPROVED=true`.
- Live webhooks fail closed until the governed CRM event endpoint is configured.
- Customer details are not copied into the webhook handoff. The CRM receives only
  Stripe/object identifiers, the internal event identifier, status, amount, and
  currency.

## Vercel environment variables

Use `.env.example` as the inventory. Store values in Vercel environment settings;
never put secrets into source code, GitHub, screenshots, chat, or client-side
JavaScript.

For staging, configure the variables for Preview only and include the exact staging
origin. Keep production variables unset until the production gate is approved.

## Sandbox acceptance

1. Open a confirmed test event by changing its public status to `open` and adding
   its identifier to the staging allowlist.
2. Select the session on staging and confirm Checkout shows the expected USD 20
   Group Healing product.
3. Complete a Stripe test-card payment.
4. Confirm the success return, Stripe receipt, signed webhook delivery, duplicate
   webhook idempotency at the CRM gateway, and no public Zoom link.
5. Test cancellation, declined payment, asynchronous failure where applicable,
   refund, duplicate delivery, and an event not on the allowlist.
6. Restore any synthetic event data before production promotion.

## Production gate

Do not enable live checkout until the operating legal entity and contact routes are
published, the Group Healing refund/cancellation/no-show/replay terms are approved,
the privacy and terms pages name Stripe, the event capacity and Zoom fulfillment
owner are confirmed, and the CRM payment event gateway has passed sandbox tests.

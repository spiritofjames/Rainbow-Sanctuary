# Free Programme Contribution Follow-up

## Purpose

Rainbow Sanctuary may send one optional contribution invitation after a completed
registration for a free, donation-based programme. It explains that giving is
optional and links to the public contribution page, where the contributor chooses
their own amount through Stripe.

## Current scope

Only `autism-family-support` is eligible at launch. Paid programmes, enquiries,
private-healing applications, booking requests, and programmes not explicitly
listed in the server-owned eligibility set never receive this message.

## Trigger and delivery

1. The registration must be accepted by the private CRM and mirrored to HubSpot.
2. The existing registration confirmation is sent immediately.
3. Resend is asked to schedule one message for `followUpAt`, exactly 24 hours
   after the submitted registration timestamp.
4. The stable idempotency key is
   `intake:{eventId}:optional-contribution-follow-up`; retries cannot create a
   second scheduled message for the same registration.

The scheduled message uses the official Rainbow Sanctuary sender and sends
contribution questions to `payments@rainbowsanctuary.life`. It links to
`https://rainbowsanctuary.life/contribute`, not a hard-coded Stripe checkout
URL.

## Safety and operation

- The flow observes the existing Resend production gates:
  `RESEND_EMAIL_ENABLED`, `RESEND_PRODUCTION_APPROVED`, and `RESEND_API_KEY`.
- A scheduling failure is logged but never invalidates a successfully accepted
  registration.
- The email does not include the participant photo, intake message, health
  details, or payment information.
- Before enabling another free programme, add it to the explicit eligibility set
  in `api/_lib/operations-notification.mjs`, verify its completed-registration
  journey, and add a corresponding test.

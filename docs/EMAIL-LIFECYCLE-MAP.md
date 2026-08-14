# Rainbow Sanctuary email lifecycle

## Purpose and boundary

This system sends service messages that are expected because a person made an
enquiry, requested support, applied, booked, paid, or joined a program. It is not
a newsletter or marketing list. Resend is outbound-only; replies continue to
Google Workspace and arrive in the shared Gmail inbox under the existing labels.

Every accepted public form receives exactly one immediate acknowledgement after
its safe CRM and HubSpot handoff. For private healing, the acknowledgement is
sent only after the protected attachment process accepts the submission. It
never includes enquiry text, case details, a headshot, or other attachment data.

## Sender routing

| Message family | From and Reply-To | Gmail destination |
| --- | --- | --- |
| General enquiries and applications | `hello@rainbowsanctuary.life` | RS — General |
| Scheduling, bookings, programs and retreats | `bookings@rainbowsanctuary.life` | RS — Bookings |
| Help and technical problems | `support@rainbowsanctuary.life` | RS — Support |
| Privacy requests | `privacy@rainbowsanctuary.life` | RS — Privacy |
| Financial receipts, failures and refunds | Stripe, with `payments@rainbowsanctuary.life` as the business support contact | RS — Payments |
| Internal enquiry/payment operations alerts | `hello@` or `bookings@`, addressed only to Ethel | Ethel's official Workspace inbox |

Stripe remains the authority for financial receipts and refund confirmations.
Resend must not generate a second receipt that could disagree with Stripe.

## Lifecycle inventory

The source of truth is `emails/catalog.mjs`. Each row has a published Resend
template and a disabled event automation contract.

| Stage | Event | Template | Trigger owner |
| --- | --- | --- | --- |
| Enquiry | `rs.enquiry.received` | `rs-enquiry-received` | Website/CRM after safe enquiry capture and HubSpot handoff |
| Support | `rs.support.received` | `rs-support-received` | Support intake |
| Privacy | `rs.privacy.requested` | `rs-privacy-request-received` | Restricted privacy intake |
| Application | `rs.application.received` | `rs-application-received` | Website/CRM after secure intake handoff |
| Application | `rs.application.more_information` | `rs-application-more-information` | Human reviewer |
| Application | `rs.application.accepted` | `rs-application-accepted` | Human reviewer |
| Application | `rs.application.declined` | `rs-application-declined` | Human reviewer |
| Scheduling | `rs.scheduling.invited` | `rs-scheduling-invitation` | CRM |
| Group Healing | `rs.group_healing.booked` | `rs-booking-confirmed` | Verified test-mode Stripe webhook + approved event catalog; staging allowlist only |
| Group Healing | `rs.group_healing.reminder.24h` | `rs-booking-reminder-24h` | CRM scheduler |
| Group Healing | `rs.group_healing.reminder.1h` | `rs-booking-reminder-1h` | CRM scheduler |
| Booking | `rs.booking.changed` | `rs-booking-changed` | Human/CRM |
| Booking | `rs.booking.cancelled` | `rs-booking-cancelled` | Human/CRM |
| Session | `rs.session.follow_up` | `rs-session-follow-up` | CRM scheduler after attendance state |
| Retreat | `rs.retreat.application.received` | `rs-retreat-application-received` | CRM after secure storage |
| Retreat | `rs.retreat.accepted` | `rs-retreat-accepted` | Human reviewer |
| Retreat | `rs.retreat.preparation` | `rs-retreat-preparation` | CRM scheduler after approved content |
| Retreat | `rs.retreat.follow_up` | `rs-retreat-follow-up` | CRM scheduler |
| Program | `rs.program.enrolled` | `rs-program-enrollment-confirmed` | Verified test-mode Stripe webhook for an allowlisted server-catalogue programme variant; production remains gated |
| Program | `rs.program.session.reminder` | `rs-program-session-reminder` | CRM scheduler |
| Program | `rs.program.completed` | `rs-program-completed` | Human/CRM after completion review |

No automation is enabled merely because it exists. Its trigger producer, data
contract, consent basis, timing, cancellation behavior, staging evidence and human
owner must first pass acceptance.

## Sequence rules

1. Immediate acknowledgements are one service email per accepted action.
2. A booking confirmation follows a verified paid Stripe event, never a browser
   success-page query string.
3. The CRM emits exact reminder events. Resend does not infer dates or calculate a
   participant's timezone.
4. Cancellation suppresses future reminders before the cancellation message is
   emitted.
5. Follow-ups require the relevant attendance or completion state.
6. Every producer supplies a stable idempotency key or event identity.
7. Message variables contain the minimum operational data. No case notes, health
   information, payment-card data, identity documents, or headshots are allowed.
8. A direct programme purchase sends one programme enrollment confirmation after
   the signed paid event. Stripe remains the only financial-receipt sender.
9. Accepted enquiries and verified payments send one minimal Ethel operations
   alert using the source event ID as the Resend idempotency key. The alert links
   to the owned HubSpot contact and excludes enquiry text, attachments, email
   addresses and payment-method data.
10. Each accepted website form sends one visitor acknowledgement using the same
    intake event ID. General and group enquiries use `rs-enquiry-received`;
    private healing uses `rs-application-received`; Autism & Family Support keeps
    its specialised registration confirmation so a visitor never receives two
    immediate acknowledgements. Its optional contribution follow-up remains a
    separate consent-based message scheduled for the next day.

## Interim HubSpot visibility

- Enquiries and payments use contact upsert by email and remain assigned to
  Ethel. The former public-form submission is not repeated, which removes the
  duplicate HubSpot form timeline entry on browser retries.
- A verified purchase updates the contact with the approved programme, payment
  reference and Customer lifecycle stage. Stripe and the private Rainbow CRM
  remain the financial authority; HubSpot is an operational view only.

## CRM handoff contract

The CRM owns lifecycle state, eligibility, scheduling and timing. It emits only an
approved event name plus the exact variables declared by the matching template.
The recipient email is used by Resend for delivery but must not be written into
operational logs. Resend delivery events return metadata such as delivery status
and message ID; they do not change clinical, eligibility or payment state.

# Rainbow Sanctuary email lifecycle

## Purpose and boundary

This system sends service messages that are expected because a person made an
enquiry, requested support, applied, booked, paid, or joined a program. It is not
a newsletter or marketing list. Resend is outbound-only; replies continue to
Google Workspace and arrive in the shared Gmail inbox under the existing labels.

The public site's sensitive healing application is deliberately not connected to
email automation yet. A headshot and private health or life context must first
have an approved secure intake store, access policy, retention period, deletion
process, and CRM handoff. Email must never carry that material.

## Sender routing

| Message family | From and Reply-To | Gmail destination |
| --- | --- | --- |
| General enquiries and applications | `hello@rainbowsanctuary.life` | RS — General |
| Scheduling, bookings, programs and retreats | `bookings@rainbowsanctuary.life` | RS — Bookings |
| Help and technical problems | `support@rainbowsanctuary.life` | RS — Support |
| Privacy requests | `privacy@rainbowsanctuary.life` | RS — Privacy |
| Financial receipts, failures and refunds | Stripe, with `payments@rainbowsanctuary.life` as the business support contact | RS — Payments |

Stripe remains the authority for financial receipts and refund confirmations.
Resend must not generate a second receipt that could disagree with Stripe.

## Lifecycle inventory

The source of truth is `emails/catalog.mjs`. Each row has a published Resend
template and a disabled event automation contract.

| Stage | Event | Template | Trigger owner |
| --- | --- | --- | --- |
| Enquiry | `rs.enquiry.received` | `rs-enquiry-received` | Website/CRM after safe enquiry capture |
| Support | `rs.support.received` | `rs-support-received` | Support intake |
| Privacy | `rs.privacy.requested` | `rs-privacy-request-received` | Restricted privacy intake |
| Application | `rs.application.received` | `rs-application-received` | CRM after secure storage |
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

## CRM handoff contract

The CRM owns lifecycle state, eligibility, scheduling and timing. It emits only an
approved event name plus the exact variables declared by the matching template.
The recipient email is used by Resend for delivery but must not be written into
operational logs. Resend delivery events return metadata such as delivery status
and message ID; they do not change clinical, eligibility or payment state.

# Karma booking: details first, then payment

Owner direction, 3 November 2026. Staging-only implementation; production is not
authorized by this change. Original peace homepage remains unchanged.

## Visitor journey

1. Personal Karma Reconciliation has a single spacious closing booking card.
   Main CTA: **Book this session**. A smaller **Get in touch** text link opens a
   non-payment enquiry with Karma context.
2. The booking form collects name, email, international WhatsApp, current
   challenges, intended outcome, recent headshot and existing consents. No
   timezone or preferred days/times fields are present.
3. **Continue to payment — USD 500** submits the protected application first.
   The server must successfully persist the contact, private file and restricted
   note before it returns `paymentUrl`. No payment URL is returned on failure.
4. The browser verifies the exact owner-approved Stripe link and matching opaque
   application UUID, then navigates. A manual payment link remains visible if
   navigation is unavailable. Neither form submission nor redirection makes a
   charge or confirms a payment.
5. Stripe receives only the opaque UUID as `client_reference_id`, not answers,
   headshot, contact details or credentials in the URL. The visitor is asked to
   use the application email at checkout. Reference documentation:
   https://docs.stripe.com/payment-links/url-parameters.
6. The details-received email and manager intake alert explicitly say payment is
   not yet confirmed. A signed, approved paid Stripe event remains the payment
   authority. Its valid UUID reference is included in the manager handoff for
   reconciliation, not authentication or automatic permission to retrieve data.
7. Our manager arranges the appointment time after payment. No automatic time
   reservation or calendar booking is claimed.

## Tests and boundaries

- Full quality preflight: **273 tests passed**, 28 transactional template/contracts,
  66 HTML pages, 59 discovery routes, 358 public-build files, release integrity
  and whitespace checks passed.
- Tests execute the actual form logic and actual multipart HTTP handler with
  strictly mocked providers: contact/file/note failures cannot produce payment
  navigation; missing headshot is rejected before save; unexpected URL or
  unaccepted response cannot redirect. Other private sessions and December
  discovery-call behavior remain covered.
- Local browser layout reviewed at 1280px and 390px; no page overflow, full-width
  mobile booking button, separate readable secondary text action. Browser size
  reset after testing. No live form, email, CRM or charge was created in this task.
- Generated Markdown contains the revised booking copy and no unresolved form
  template syntax. An initial Markdown regression failed; static shared copy
  was corrected and the full suite rerun successfully before release.
- The public Payment Link is shareable outside this journey and can be reused.
  This flow does not claim provider-side enforcement of prior submission,
  single-use payments, or permanent email-delivery idempotency.
- Still required before production readiness: actual Stripe `plink_...` mapping,
  webhook/currency verification and an owner-approved provider test-mode paid
  event. No real charge, live Stripe configuration change or production merge.
- Draft PR #183 is an older production candidate and must not be merged as-is;
  a later candidate must include the original-homepage and simplified-form
  owner corrections plus this save-first booking flow.

# Personal Karma Reconciliation booking update

Date: 2 November 2026
Branch: `codex/website-updates-20261102`
Baseline: production `7a7d7e1eeaf313e152d8c126b0952c89054af286`

## Owner correction — 3 November 2026

Restore the original “Home is where your heart feels peace” root homepage on
protected staging by reversing only the earlier identity-homepage PR #181.
Keep the new homepage preserved on its separate branch, not published at `/`.
Preserve existing schema/search improvements and the USD 500 Karma payment flow.
Remove timezone and preferred days/times from the browser, submission payload,
server requirement and new HubSpot notes. Existing historical QA notes are not
edited or deleted. The remaining application fields are name, email, WhatsApp,
session selection, current challenges, intended outcome, recent headshot and
the existing privacy/photo consents. The team agrees appointments privately.
Historical QA observations below that mention timezone describe the earlier
candidate only, not this corrected form. No production release is included.

## Owner-approved scope

- USD 500 per private session, without a further planning-fee uplift.
- Exact payment URL: <https://book.stripe.com/3cIdR9dEd1mdfU15ov3Nm0q>.
- Capture contact details for manager-led appointment arrangement.
- Preserve the existing homepage and keep the new-homepage branch separate.

## Implemented locally, not yet deployed or live-certified

1. Primary application: name, email, international WhatsApp number, private
   session context/current challenges, intended outcome, recent headshot and
   consent. Owner correction on 3 November removes timezone and availability
   fields, browser collection and server requirements. Appointment details are
   agreed later by the manager.
2. Restricted HubSpot intake note preserves the application and consent evidence.
   No scheduling fields or private narrative are sent to Stripe.
3. The exact Stripe link is visible for customers who have agreed the next step
   with the team. Instructions say application first and the same email at checkout.
4. A mapped, signed, paid Checkout event is checked against the USD 500 catalogue.
   Unpaid, unknown, wrong-price, wrong-session and unapproved live events fail closed.
5. The payment upsert matches the contact by email. Valid checkout WhatsApp data
   populates native `phone` and `hs_whatsapp_phone_number`, including the native-field
   fallback. Missing numbers do not erase a previously supplied intake phone.
6. Source-controlled customer confirmation says payment received, not appointment
   booked. Stable Checkout Session email idempotency keys cover webhook retries
   within the email provider's idempotency window; no indefinite exactly-once
   delivery claim is made. Manager alerts explain the scheduling action and flag
   missing checkout WhatsApp. Existing email allowlists and live approval gates remain.

## Critical provider gates — do not report these as passed

- Discover the actual Stripe `plink_...` identifier for the supplied URL in the
  merchant's signed-in dashboard. The URL token is NOT a Payment Link API ID.
- Verify (and, only with owner approval, configure) the exact allowlist entry in
  `STRIPE_STAFF_PAYMENT_LINK_MAP`: `<actual plink ID>:personal-karma-reconciliation`.
  Append to the existing map; do not replace unrelated mappings. An equivalent
  correctly governed Checkout metadata contract must use the catalogue offer,
  session and policy, not an arbitrary product name.
- Confirm the link's webhook endpoint and subscriptions include
  `checkout.session.completed` and `checkout.session.async_payment_succeeded`,
  its signing secret is configured, and live processing is explicitly approved.
  Never copy secret values into this document or a model prompt.
- The public checkout was observed offering USD 500 and an optional PAB 520
  conversion. Verify the *settlement/session payload* is USD 500 as expected by
  the existing handoff. Do not loosen USD validation to accept an unverified
  converted amount. If not, agree a provider-side currency configuration before launch.
- WhatsApp is OPTIONAL on the supplied public link as observed. Until it is
  required in Stripe, someone can bypass the website application and pay without
  it. Website wording is not technical enforcement. The alert directs the manager
  to the matched application, or email follow-up if no application exists.
- Verify HubSpot native WhatsApp write support, the existing private-file
  permissions/retention, Ethel ownership/alert destination, Resend senders and
  enabled transactional-delivery flags without exposing credentials.
- Run a clearly labelled, owner-approved test-mode payment flow (no real charge),
  application receipt, customer payment receipt and manager alerts. Verify the
  actual contact/note and provider delivery records, not just HTTP acceptance.
  A manual connector-created contact alone does not prove the website integration.
- Email failures are currently logged/non-blocking by the shared webhook. Delivery
  records and manual recovery are still required; this task does not claim a
  durable retry queue or future appointment reminders.

## Release boundary

No production deployment or provider configuration changes have been made by
this local implementation. Staging already contains an earlier new homepage;
do not bulk-merge staging into main. Release only this isolated branch/diff after
the scoped tests and owner review. Keep protection enabled and use the signed-in
browser for any protected staging checks.

## Local verification checkpoint — resumed with owner approval

- Full quality preflight initially passed all 260 tests using the existing locked
  dependencies copied locally after the owner approved reuse. No download or
  installation scripts were used. A further real-handler synthetic test was then
  added and passes, bringing the suite to 261 tests.
- Nine Karma-specific tests pass. The real Stripe SDK verifies a locally signed
  synthetic event, which routes through the actual webhook handler to mocked
  HubSpot and both mocked Resend sends. An invalid signature reaches neither
  provider. A disabled HubSpot mirror returns HTTP 500 for Karma so delivery can
  retry rather than silently treating it as fulfilled. No real payment or network
  traffic occurs in this synthetic test.
- Static validation passed for 66 HTML pages.
- Email check passed for 28 templates and 28 disabled automation contracts.
- Release-integrity check passed. `git diff --check` passed.
- Discovery layer regenerated: 59 canonical routes; Karma Markdown now includes
  USD 500 and the exact payment link, with no stale “Pricing coming soon” on that page.
- Existing `Home.dc.html` SHA-256 remains
  `41a1932707d5fc9b255f01259bf4823b50538983e70401f46d94758f18341415`.
- Matching `package-lock.json` hashes were verified before reusing dependencies
  from the already installed homepage checkout:
  `eec46897ab957284888fe45bdd07f97791f89f097444ce03b6fb9c23229899cb`.
- The production homepage remains unchanged. No download/install scripts, real charge, live contact write, live email send, provider
  setting change, commit, push or deployment was performed at this checkpoint.
- Local action gate: `local_write` preflight PERMIT on 2 November 2026 at
  18:27:19 UTC for this exact worktree. Owner explicitly approved relevant source
  reads and requested the scoped implementation. The owner has now approved
  local matching dependency reuse, read-only Stripe dashboard inspection and
  clearly labelled QA application/payment emails to
  `workspace-admin@rainbowsanctuary.life`, a manager alert to Ethel and one QA
  contact. Stripe configuration changes, real card charges, WhatsApp sends and
  publishing are not authorized by those approvals.

## Provider access checkpoint

- Stripe dashboard opened at its Payment Links route but redirected to sign-in.
  It remains a read-only inspection gate pending the owner's sign-in.
- Resend also requires sign-in; no email was sent. Sending manually through a
  different mail provider would not prove the website's transactional flow and
  was not substituted for the requested test.
- HubSpot identity/schema access succeeds for account 246920029. Native
  `hs_whatsapp_phone_number` is a string. `hs_timezone` is an enumeration, not
  an arbitrary IANA string; this implementation appropriately keeps the human
  scheduling timezone in the restricted note rather than guessing an enum value.
- An exact-email search returned one pre-existing QA contact:
  [QA December Staging](https://app.hubspot.com/contacts/246920029/record/0-1/575960872693?utm_source=rainbow_karma_qa&utm_medium=agent&utm_campaign=20261102).
  No duplicate contact was created and no prior fields/history were overwritten.
  Asked the owner whether to reuse this record or leave CRM writes untouched.
- Local browser checks: fixed USD 500 and the exact Stripe link render; the
  application preselects Karma, prefills editable America/Panama, and the timezone
  input is required. Switching to another private session removes the Karma-only
  price and scheduling fields. No form was submitted or consent box checked.
- These are local and provider-access checks, not live end-to-end acceptance.

## Latest owner-approved QA progress

- Owner confirmed both provider sign-ins, approved reuse of the existing QA
  contact, then explicitly approved these two fields only: WhatsApp
  `+12025550147` and timezone America/Panama (`america_slash_panama`). Both were
  written through the HubSpot connector and read back correctly. Existing name,
  email, phone and Ethel owner `166816652` remain unchanged. No contact was created,
  no history replaced, and no marketing/WhatsApp message was triggered.
- Stripe's signed-in product/price pages confirm active product
  `prod_VYUwMFGLKNhGwQ` and one-time USD 500 price
  `price_1UXNwPHrqlaOfUb7KctKkHbq`, marked inclusive tax behavior. This is saved
  price configuration, not verification of the merchant's tax registrations.
- The browser Workbench read-only Payment Links command timed out without a
  usable response. The Stripe session subsequently expired before Payment Link
  ID/webhook inspection; no settings or payment changes were made. Asked owner
  to unlock Stripe and leave the Karma Payment Link visible.
- Resend is signed in. An exact QA-recipient search shows the two earlier enquiry
  acknowledgments delivered ten days before this audit. These are historical
  transport evidence only, not a new Karma test.
- Owner explicitly authorized pushing `codex/website-updates-20261102` and creating
  a protected candidate preview, with no staging/main merge or production change.
  The planned preview PR will be draft and based on `main` so its diff excludes the new homepage
  already present in the unrelated staging branch. Do not mark live integration
  accepted until the actual candidate and provider delivery checks pass.

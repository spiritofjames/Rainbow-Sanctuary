# Trustpilot review collection

## What is ready

- The stable link to share with a client is `https://rainbowsanctuary.life/review`.
  It presents a clear, optional invitation and then opens the Trustpilot review
  form for `rainbowsanctuary.life`.
- A review invitation at the bottom of the homepage links to `/review`. It is
  an invitation to share an honest experience, not a rating claim or a prompt
  for a favourable review.
- `rs-session-review-request` is a source-controlled transactional template for
  the existing email lifecycle. Its event is `rs.session.review_requested`.
- The homepage hero links directly to the public reviews with “Read our reviews
  on Trustpilot.” It works without JavaScript and shows no score, star rating,
  logo asset, TrustBox, reviewer portraits, or cached review count.

## Manager workflow

After an eligible adult client has attended a session with Stephanie, a manager
can send the stable link directly: `https://rainbowsanctuary.life/review`.
Use plain, neutral wording: “If you feel comfortable, you are welcome to share
an honest account of your experience on Trustpilot. There is no expected rating.”

Do not ask only people who had a notably positive experience, offer a reward,
make future service contingent on a review, or ask for a particular rating.
Never send an invitation for a child, from a sensitive safeguarding case, or in
a way that reveals private-session context.

## Email activation gate

The email template is intentionally present but its automation remains disabled.
Before enabling it, an owner must configure the CRM event with:

1. Trigger: attendance confirmed (not merely booked, paid, or scheduled).
2. Delay: a consistent 3–7 days after attendance; apply the same rule to all
   eligible clients in a defined service cohort.
3. Recipient rule: adult clients only; exclude minors, safeguarding-sensitive
   relationships, unresolved disputes, and anyone without an appropriate
   service-relationship contact basis.
4. Data: only `NAME`, `SESSION_NAME`, and
   `REVIEW_URL=https://rainbowsanctuary.life/review`. Do not pass session notes,
   health information, a case status, payment information, or a rating field.
5. Delivery safety: a stable idempotency key, suppression for cancelled or
   undeliverable messages, a human owner, and staging evidence.

For historical outreach, define an inclusive, date-bounded eligible cohort
before sending (for example, all adult clients who completed a specified type
of session within a date range). Do not curate the list by expected sentiment.

## Trustpilot dashboard check

In Trustpilot Business, use the **Get reviews** or **Invitation methods** area
to locate its shareable review invitation for the claimed domain. Confirm that
it opens the Rainbow Sanctuary review form. If Trustpilot supplies a different
canonical share link or required attribution parameters, replace only the
external `href` in `review/index.html`; keep the public link
`https://rainbowsanctuary.life/review` unchanged so managers and email templates
do not need updating.

## Homepage review link — checked 23 October 2026

The public profile at
<https://www.trustpilot.com/review/rainbowsanctuary.life> showed one individual
five-star review and an overall TrustScore of **3.7** (official star graphic:
3.5 out of 5). A review's individual rating is not the business TrustScore.
These are dated verification facts, not values to hardcode into the homepage.

Read-only inspection of the claimed Trustpilot Business account showed only
**Review Collector** when filtering website widgets to those included in the
current plan. Its purpose is collecting reviews, not displaying a live score.
The Marketing assets page explicitly stated that separate branding assets,
including logos and stars, are unavailable on the free plan. No subscription,
trial, review invitation, account setting, or provider integration was changed.

The old configuration-gated rating row was removed: its CSS `display` rule
overrode the HTML `hidden` attribute, exposing empty stars even though the
rating configuration was disabled. Its unused script and score/avatar settings
were also removed so they cannot accidentally reintroduce stale rating claims.

The replacement is a normal, accessible link styled in Rainbow Sanctuary's own
visual language. It loads no Trustpilot script, image, iframe, or API request.
Only choosing the link opens the independent profile in a new tab. New reviews
are visible there without a site update. The separate neutral review invitation
and disabled email automation remain unchanged.

## If a live rating widget is added later

Use only an official widget included in the account's confirmed plan, with the
correct business-unit and template identifiers obtained from the dashboard.
Do not activate a trial, upgrade a subscription, copy restricted branding
assets, or imitate a five-star aggregate badge without owner approval and
verified rights. Always distinguish individual reviews from the overall score.

Before embedding, review the current provider requirements, privacy/consent,
accessibility, CSP allowlist, performance, and failure behavior. Keep a direct
profile link available if an embedded widget cannot load. Never scrape a score
or maintain a hand-edited star rating as a substitute for a permitted live widget.

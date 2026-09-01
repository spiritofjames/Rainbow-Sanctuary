# Trustpilot review collection

## What is ready

- The stable link to share with a client is `https://rainbowsanctuary.life/review`.
  It presents a clear, optional invitation and then opens the Trustpilot review
  form for `rainbowsanctuary.life`.
- `rs-session-review-request` is a source-controlled transactional template for
  the existing email lifecycle. Its event is `rs.session.review_requested`.
- The homepage has no Trustpilot score, star rating, TrustBox, or review count.
  Do not add any of those until genuine reviews exist and the display details are
  approved.

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

## Future homepage score

The homepage now contains a finished, configuration-gated proof row beneath its
hero buttons. It follows the approved visual direction: up to four overlapping
real participant portraits, a star treatment with the verified score, and the
Trustpilot review count. It is hidden unless every required value is valid.

When reviews and image permissions are ready, update the `trustpilot` section of
`site-config.js` using only values visible on the verified public Trustpilot
profile:

```js
trustpilot: {
  enabled: true,
  profileUrl: "https://www.trustpilot.com/review/rainbowsanctuary.life",
  score: 4.8,
  reviewCount: 24,
  avatars: [
    { src: "./assets/editorial/trustpilot-participant-01.jpg", alt: "Rainbow Sanctuary participant" }
  ]
}
```

The component refuses to show if the account link is not a Trustpilot HTTPS URL,
the score is outside 1–5, the review count is not at least one, or there are no
consented local participant images. Do not use stock, AI-generated, or
unconsented faces, and do not replace the Trustpilot count with a broader
“trusted by” number unless that number has a documented, auditable basis.

The row does not load a third-party TrustBox script. If a later decision requires
Trustpilot's own widget instead, review its current embed requirements,
accessibility, and CSP impact before replacing this lightweight display.

# December retreat staging readiness

Release scope: the approved December landing-page content and media, calendar, enquiry/discovery-call journey, and search-readable structure. Production remains unchanged. Publication follows feature branch → pull request → protected preview → staging.

## Visitor and team journey

1. Homepage December banner and website calendar lead to `/awakening-your-inner-light-2026`.
2. The shared event configuration identifies `awakening-inner-light-december-2026`, 3–9 December 2026, USD 3,500. The calendar displays all seven days and keeps the event visible through its final day.
3. Register interest opens `/apply?reason=events&program=awakening-inner-light-december-2026`. The separate discovery-call CTA adds `intent=discovery-call`; the form also lets visitors choose between these two intentions.
4. Required contact fields, a message and follow-up consent go to the existing `/api/crm/intake` service. Its existing legacy-CRM handoff is followed by HubSpot contact/note synchronization, applicant acknowledgment, and an operations email for Ethel.
5. A discovery call is a request for human follow-up, not an automatically booked slot. No scheduler URL is configured. Enquiry submission is not acceptance, a place reservation, or a payment request.

The website calendar uses its approved static schedule when no public CRM calendar feed is configured. This release does not claim a new Google Calendar synchronization or booking engine.

## Discovery and privacy

- The page delivers substantive text, links and 16 native HTML FAQs without JavaScript. The FAQ JSON-LD and visible answers share `data/december-retreat-faqs.json` as their source.
- Canonical URLs, sitemap dates, Event dates/price, and a wide social-sharing image align with the December page. The October page remains an archive; it does not advertise an active offer.
- Exact December venue/location and availability are not invented. Venue details are still needed for complete event rich-result eligibility. Structured data does not guarantee indexing, rich results, or AI citations.
- CSP permits only the approved YouTube videos and Spotify track. Participant testimonials and Spotify are click-to-load; Hanan's existing in-view behavior retains its published controls and reduced-motion/data-saving exceptions.
- The staging host receives `X-Robots-Tag: noindex, nofollow, noarchive`; deployment authentication remains the access boundary. Production indexing directives are unchanged.

## Verification and release gates

- Local quality preflight: 211 tests; 27 email templates/27 disabled automation contracts; release-integrity check; 66 HTML pages; generated discovery configuration. These are local results, not delivery proof.
- Browser verification: desktop and narrow mobile landing, calendar, both enquiry intents, gallery controls, testimonial no-autoplay, and no-JavaScript FAQs. Local form submissions are intercepted and do not reach providers.
- Before staging: commit only reviewed source and web-delivery assets, excluding local outputs, source masters and security receipts; require PR CI and protected preview checks.
- After staging: verify deployment SHA, authenticated routes, unauthenticated protection, noindex and provider behavior. Never promote to main as part of this task.

## Authorized live acceptance tests

James approved two clearly marked test enquiries only: December retreat interest and discovery-call request. Acknowledgments go to `workspace-admin@rainbowsanctuary.life`, and operations alerts go to Ethel. Both use the same approved test contact; HubSpot may correctly deduplicate it into one contact with two enquiry notes. No customer record or real appointment is required.

For each test, record the submission reference, HTTP outcome, HubSpot evidence, and acknowledgment/operations delivery evidence separately. A success screen or provider acceptance is not proof that an email reached an inbox. The existing intake treats the email and HubSpot mirror as best-effort after its primary CRM handoff; partial failures therefore need explicit log/provider checks. Do not repeatedly submit to manufacture a passing result.

Hosted results and deployment identifiers will be retained in the task's local `output/staging-2026-10-22/` evidence, outside the public deployment. Until those gates pass, this document is a release plan and local readiness record—not a declaration of production readiness.

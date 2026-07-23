# Rainbow Sanctuary — Final Inputs Handoff

The site structure is ready. Confirmed values are added in one file:
`site/site-config.js`. Empty values deliberately keep an honest, usable
fallback instead of publishing invented information.

## 1. Imagery status

The three Home signature-moment slots are complete using generated,
photorealistic editorial scenes:

| Config key | Current asset |
|---|---|
| `home-spiral` | `assets/editorial/home-spiral-editorial.jpg` |
| `home-family` | `assets/editorial/home-family-editorial.jpg` |
| `home-community` | `assets/editorial/home-community-editorial.jpg` |

These generated scenes are temporary visual direction and must not be described
as documentary evidence, testimonials, or proof of outcomes. Exact prompts and
provenance are recorded in `IMAGE-SOURCES.md`. Consent-cleared photography can
replace them later through `site/site-config.js`, but it is no longer a launch
dependency.

The Home hero now also uses an optimized cinematic nature reveal derived from a
video supplied by James. Confirm the right to adapt and publish the source before
public deployment, or replace it with owned/commissioned footage following the
same direction. See `VIDEO-SOURCES.md` for the source URL, derivatives, dimensions,
performance sizes, and replacement rule.

The supplied full-color lotus now serves as the shared navigation logo, browser
favicon, and Apple touch icon. The original Canva SVG is preserved under
`site/assets/brand/`, and the live interface uses exact optimized PNG derivatives.
Confirm Rainbow Sanctuary holds the necessary artwork and Canva publication rights
before public deployment.

Optional trust-strip portraits use `testimonial-madley`,
`testimonial-irene`, `testimonial-leann`, and `testimonial-jashley`. The
initials already shown are the finished fallback. Add portraits only with
confirmed web-use consent. Never use generated faces for testimonials,
participants, children, Stephanie, or documentary program imagery.

The enriched offer pages now use six photorealistic generated scenes under
`site/assets/editorial/`. They give the program families human warmth without
representing the depicted models as Stephanie, actual participants, or evidence
of outcomes. `Earth-Healer-Training.dc.html` uses the supplied
Panama landscape at `site/assets/panama-earth-01.jpg`.

The About Stephanie page uses `site/assets/stephanie-portrait.jpg`, supplied and
manually cropped by James on 2026-07-14 as Stephanie's canonical profile portrait.
Confirm photographer/source permission if James or Stephanie does not own the
image rights.

The Spiral pages continue to use `site/assets/stephanie-facilitating.jpg`,
selected from the supplied Spiral 1 Drive archive. It shows Stephanie
facilitating the real group session, with other participants visible. Confirm
Stephanie's and all visible participants' web-use consent before public launch.
The earlier blindfolded Spiral candidate remains bundled but unpublished.

For any later replacement documentary file:

- use an optimized WebP or AVIF plus a reliable fallback where the deployment
  system supports it;
- crop the three Home images toward square/portrait and leave the bottom third
  calm enough for the existing white caption overlay;
- write a factual alt description in the matching `alt` field;
- confirm participant and parent/guardian consent before publishing people.

## 2. Pricing

Online Group Healing is configured at **$20 USD per session** as an accessible
pilot price. Keep this price for the first 6–8 sessions, then review attendance,
repeat participation, refunds/no-shows, and movement into Spiral I before changing
it. Do not silently convert the wellbeing session into a free lead magnet.

The course breakdown supplied on 22 July 2026 confirms and the website now shows:

| Offer | Published price |
|---|---|
| Spiral I · 4 days | USD 1,399 · Early Bird USD 999 |
| Spiral II · 4 days | USD 1,599 · Early Bird USD 1,299 |
| Spiral III · 4 days | USD 1,599 · Early Bird USD 1,399 |
| Spiral IV · 4 days | USD 1,599 · Early Bird USD 1,399 |
| ReGeneration Level I · 5 days | USD 2,999 |
| ReGeneration Level II · 4 days | USD 2,399 |
| Earth Healer Level I · 3 days | USD 500 |
| Earth Healer Level II · 3 days | USD 699 |
| Crystal Healing · 4 days | USD 899 |
| Intuitive Perception · 4 days | USD 899 |
| Awaken Infinite Potential Adult Program · 5 days | USD 1,599 |
| Children’s Potential Mentor/Coach Certification package | USD 7,399 |

The Children’s package source describes one adult plus one child, Spiral I and II,
Children Levels I and II, lifetime Spiral review, and children’s review until age
18. The final certification title, number and duration of meetings, assessment,
practicum, transferability, and included expenses still need written confirmation
before payment opens.

### Prices still missing or structurally unresolved

- Personal Karma Reconciliation Session;
- Family Information Field Restoration Session;
- DNA Activation;
- the Private Healing hub, if it is intended to have a separate umbrella fee;
- Holographic Healing;
- Unlock the Potential as a standalone child/family program;
- Rainbow Light Code Healing as a standalone offer—the source says it is covered
  in Earth Healing, so the team should either fold it into that page or set a fee;
- Tea Ceremony Mastery—the source says it is covered in Awaken Infinite Potential,
  and there is not currently a standalone page or price;
- Earth Healing Zone, if it will become a paid membership or event rather than a
  community practice.

The source provides early-bird amounts for Spiral I–IV but no deadlines or rules.
Taxes, deposits, instalments, refund/cancellation terms, inclusions, and cohort
dates also remain unconfirmed across the catalog. Until a standalone value is
confirmed, the relevant public-facing badge remains “Pricing coming soon.”

## 3. Application and enquiry form

Set `form.endpoint` to a secure HTTPS endpoint. The form sends `multipart/form-data`
with `name`, `email`, `reason`, `privateSession`, `currentChallenges`,
`intendedOutcome`, `message`, `headshot`, `privacyConsent`, `photoConsent`, and
the policy version. Private Healing applicants must provide a recent JPG, PNG,
or WebP headshot up to 10 MB. The endpoint must accept browser CORS requests,
validate every field and file server-side, store uploads privately, and return a
successful HTTP status.

Recommended launch setup: use a HubSpot multi-step form/CRM record as the intake
and source of truth. After human review and acceptance, send the applicant a
private or single-use Calendly link. Connect Calendly to a private Google Calendar
for availability. Do not expose scheduling before acceptance, and do not put
health narratives, headshots, or client names on a public calendar.

Until connected, submission stays on the form and explicitly says that no
message was sent. After connection, test one real submission and confirm both
delivery and the visitor-facing success state before launch.

Before enabling the headshot upload, confirm and publish its purpose, access
controls, retention/deletion period, processor, storage region, and withdrawal
route. Set `form.provider`, `form.photoRetention`, `scheduling.provider`, and
`scheduling.acceptedApplicantUrl` once those decisions are final.

## 4. Events calendar

The calendar now includes **Awakening Your Inner Light**, 1–7 October 2026 in
Bocas del Toro, Panama. The supplied brochure confirms a standard rate of USD
3,500 per person and an early-bird rate of USD 3,000 with a 50% deposit before 1
September 2026. It links to a dedicated event page and currently accepts interest
only—not payment or a guaranteed reservation.

Add further confirmed public events to `events.items` in `site/site-config.js`. Each item
uses `id`, `title`, `category` (`group`, `retreat`, `adult`, `family`, or `community`),
`startDate`, optional `endDate`, `location`, optional `venue`, `summary`, `status`,
and `registrationUrl`. Dates use `YYYY-MM-DD`; the configured calendar timezone
provides the public context. The page provides month navigation, filters, an
upcoming list, and an honest empty state when no dates are confirmed.

Before opening retreat registration or collecting a deposit, confirm the named
venue, operator/legal basis, adult health-and-medication screening, contraindications,
facilitator credentials, emergency and medical escalation, transport, insurance,
room arrangements, exact inclusions/exclusions, informed consent, conduct,
cancellation/refund terms, and integration support. The current page deliberately
does not present the retreat as medical or mental-health treatment.

Group Healing now has a self-serve booking path on its own page: visitors choose a
confirmed date in the first-party calendar, continue directly to a USD 20 Stripe
checkout, and then receive confirmation and Zoom access. It deliberately has no
consultation, enquiry, or wait-list fallback. Each `group` event needs `time`,
`timezone`, `price`, `status: "open"`, and a secure `checkoutUrl`; a shared Stripe
Payment Link can instead be set at `events.groupHealing.checkoutUrl`. Stripe links
receive the event ID as `client_reference_id` so downstream automations can match
the payment to the selected session.

Before opening Group Healing registration, confirm the first two dates and themes,
time and timezone, facilitator, attendance cap, accessibility needs, replay policy,
and cancellation/transfer/no-show terms. Create the Stripe Payment Link and connect
its completed-payment event to the confirmation email, calendar record, and correct
Zoom access through Stripe automation, Zapier/Make, HubSpot, or the future CRM. The
static website does not send Zoom details by itself. Add the confirmed dates as
`group` events only after that fulfillment route has been tested end to end.

Use a dedicated public Google Calendar only if the team wants calendar publishing.
Keep operational scheduling in a separate private calendar. The public calendar
must contain event information only—never applicant or client data. Review privacy
and cookie behavior before embedding Google Calendar, maps, Calendly, or HubSpot;
the current first-party calendar view needs no third-party embed.

## 5. Deployment facts still requiring confirmation

- final public domain and canonical URL;
- production hosting/deployment target;
- final contact email, phone, and social URLs if they are to be published;
- production host, form/email processor, scheduling provider, payment provider,
  their processing locations, and their required privacy wording;
- legal business name, registration number, registered address, country/region of
  establishment, governing law, and dispute forum;
- dedicated privacy, legal, accessibility, and safeguarding contact routes;
- enquiry and customer-record retention periods.

These are intentionally not invented in the prototype. Once confirmed, add
canonical/social metadata and the final contact/legal links during deployment.

Enter confirmed legal facts in the `legal` object in `site/site-config.js`. Six
tailored legal/trust pages and sitewide footer links are already implemented. See
`LEGAL-REVIEW-NOTES.md` for the data-flow audit, official source guardrails, and the
final professional-review checklist.

## 6. Booking, cancellation, and safeguarding rules

Before enabling payments or accepting enrollment, confirm:

- displayed price, taxes, deposit and balance schedule for every offer;
- participant cancellation, refund, transfer, no-show, operator cancellation, and
  force-majeure rules, including any mandatory consumer cancellation rights;
- program-specific terms shown before payment and an auditable acceptance record;
- named safeguarding lead, child-program age ranges, staff screening, supervision
  ratios, guardian consent, child assent, arrival/collection, incident escalation,
  emergency response, one-to-one contact, and photography/media consent procedures.

The website now tells children not to submit the form, requires an adult privacy
acknowledgment, and separates participation from publicity consent. The public
safeguarding page is not a substitute for the internal policy and operating process.

## 7. Program facts still requiring confirmation

- dates, duration, delivery format, location, cohort size, prerequisites, and
  facilitator(s) for every workshop and Spiral level;
- the Children’s Potential Coach assessment, practicum, certification title,
  issuing entity, recognition, and any professional eligibility;
- whether Earth Healer Training issues a certificate and, if so, what it
  formally represents;
- final consent and attribution wording for the selected children’s-program
  testimonial;
- confirmation of any claims in the original Drive material that the final
  team wants to retain. The current pages intentionally use responsible
  educational language and do not publish medical cures, guaranteed outcomes,
  guaranteed income, or unverified platform-support promises.

## Final launch check

After the inputs above are added: verify all three image crops on phone and
desktop, submit the live form once, inspect every published price, run a final
keyboard/contrast check, confirm analytics/cookie behavior if used, and test
the deployed domain rather than only the local prototype.

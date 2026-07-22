# Rainbow Sanctuary — Legal & Trust Layer Review Notes

This is an implementation handoff, not legal advice. The public pages are tailored
to what the current website actually does, but qualified counsel should review the
final version for the operating entity, markets, and program locations before launch.

## Public pages added

- `site/Privacy-Policy.dc.html`
- `site/Terms-Conditions.dc.html`
- `site/Cookie-Policy.dc.html`
- `site/Wellbeing-Disclaimer.dc.html`
- `site/Children-Safeguarding.dc.html`
- `site/Accessibility-Statement.dc.html`

All content pages link these from the footer. The application/enquiry form now
requires an affirmative privacy acknowledgment, records the policy version in its
payload, and warns adults not to submit medical records or unnecessary child
information. A Private Healing application additionally asks for a wellbeing
narrative and recent headshot, with separate explicit consent for processing the
photo.

## Current data and technology position

- The prototype has no analytics, advertising pixels, behavioral profiling,
  newsletter signup, payment integration, or site-set cookies/local storage.
- The application/enquiry form is the only direct collection point. It is deliberately
  disabled until a confirmed HTTPS endpoint is entered in `site/site-config.js`.
- Private Healing narratives and headshots may be sensitive personal data. Do not
  activate this flow until purpose, lawful basis, access controls, retention,
  deletion, processor, storage region, and applicant rights are confirmed. Files
  must remain private and must never be reused for publicity or model training.
- The intended operational stack is HubSpot for intake and CRM, Calendly for
  accepted applicants only, and a private Google Calendar for availability. A
  separate public calendar may contain public event details only. Never place
  applicant names, headshots, narratives, or session details in a public calendar.
- The site loads Google Fonts from Google domains. Google says the Web Fonts API is
  unauthenticated and does not set or log cookies, but it remains a third-party HTTP
  request. Self-hosting is the cleaner privacy choice if licensing and deployment
  allow it.
- Children should not use the form. Parent/guardian enquiry, minimal collection,
  separate media consent, and a complete operational safeguarding procedure are
  required before child-facing programs open.
- A cookie banner was not added because there are currently no optional cookies.
  Adding a banner with nothing meaningful to control would be misleading. Reassess
  before adding analytics, HubSpot/Calendly/Google embeds, scheduling, chat, maps,
  or payment tools.

## Facts that must be confirmed

1. Full legal entity name, registration number, registered address, and trading name.
2. Country/region of establishment, governing law, courts or dispute process, and
   all target/customer markets.
3. Privacy, legal, safeguarding, and accessibility contact routes.
4. Production host, form/email processor, scheduling provider, payment provider,
   processing countries, contractual safeguards, and retention periods.
5. Program-specific prices, taxes, deposits, cancellation/refund/transfer rules,
   operator cancellation terms, force-majeure position, and mandatory consumer rights.
6. Safeguarding lead, program age ranges, staff screening requirements, reporting
   duties, supervision ratios, incident process, emergency plan, and media-consent flow.
7. Whether marketing email, analytics, embedded media, maps, chat, or social widgets
   will be used. No such tool should be activated before the notices and controls are
  updated.
- Group Healing is presented as guided spiritual reflection and collective
  wellbeing practice—not medical care. Do not publish claims that a session
  removes vaccine ingredients, spike proteins, mRNA, graphene, heavy metals, or
  toxins; repairs DNA, cells, organs, nerves, mitochondria, immunity, or disease;
  or has scientifically established effects across distance.
- Earth Healing is framed as meditation, gratitude, community ritual, and practical
  ecological stewardship. Do not claim it prevents disasters, war, pollution, or
  illness; do not rank participants as high- or low-frequency; and do not present
  a participant threshold or recorded audio as a scientifically proven mechanism.
8. Formal production accessibility testing and the preferred response time/channel.
9. The precise purpose, retention period, deletion process, access roles, and
   storage location for application headshots and wellbeing narratives.
10. Whether HubSpot, Calendly, and Google Calendar will be embedded or merely linked,
    and the resulting cookie/transfer disclosures and processor agreements.
11. Group Healing payment, refund/no-show, replay, facilitator, accessibility, and
    online-safety terms before the first paid event opens.

## Official sources used as guardrails

- European Commission, information individuals should receive and GDPR rights:
  https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en
- European Commission, GDPR principles for collection, purpose, and retention:
  https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr_en
- Indonesia, Law No. 27 of 2022 on Personal Data Protection (official legislation
  database): https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022
- US Federal Trade Commission, COPPA business guidance:
  https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- W3C WAI, what an accessibility statement should contain:
  https://www.w3.org/WAI/planning/statements/
- Google Fonts privacy and data collection FAQ:
  https://developers.google.com/fonts/faq/privacy
- US CDC, how mRNA COVID-19 vaccines work:
  https://www.cdc.gov/covid/vaccines/how-they-work.html
- US NCCIH, current evidence overview for Reiki:
  https://www.nccih.nih.gov/health/reiki

These sources inform conservative global-facing defaults; they do not decide which
laws apply. That requires confirmed entity, market, participant, and program-location
facts.

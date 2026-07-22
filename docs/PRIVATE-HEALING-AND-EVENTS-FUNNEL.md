# Private Healing and Events — Website & Operations Funnel

## Information architecture

- **Private Healing** is a primary navigation destination with three offers:
  Personal Karma Reconciliation, Family Information Field Restoration, and DNA
  Activation.
- **Events** is a primary navigation destination for anything with a date and
  place. Its filters are Retreats, Adult Workshops, Children & Family, and
  Community.
- A retreat therefore belongs under Events. Its content may link to relevant
  Workshops or Spiral material, but it should not be buried inside About or an
  evergreen program page.

## Private Healing funnel

1. **Explore** — visitor reads the three offers, scope boundaries, and spiritual
   framing.
2. **Apply** — visitor chooses a session and submits current challenges, intended
   outcome, recent unedited headshot, and explicit privacy/photo consent.
3. **Review** — the team assesses fit and records Accepted, More information
   needed, Declined, or Referred elsewhere.
4. **Schedule** — only accepted applicants receive a private scheduling link.
5. **Prepare** — confirmation explains timing, distance format, boundaries,
   cancellation, and what is or is not required.
6. **Session** — delivered at the agreed time while the client is asleep.
7. **Written reflection** — client receives the promised written session report.
8. **Follow-up** — the team may recommend another session or other appropriate
   support without making guaranteed outcome claims.

## Recommended launch stack

- **HubSpot:** intake form, private file upload, contact record, consent evidence,
  application status, internal notes, and follow-up workflow.
- **Calendly:** scheduling only after acceptance; preferably a private or
  single-use link.
- **Google Calendar:** private availability sync. If public event publishing is
  wanted, use a completely separate public calendar containing event facts only.

Suggested CRM stages: `New application`, `Reviewing`, `Need more information`,
`Accepted`, `Scheduling sent`, `Scheduled`, `Session completed`, `Report sent`,
`Follow-up`, `Closed`, and `Declined/referred`.

## Events data contract

The current first-party calendar reads `events.items` from `site-config.js`:

```js
{
  id: "retreat-2026-11",
  title: "Retreat name",
  category: "retreat", // retreat | adult | family | community
  startDate: "2026-11-05",
  endDate: "2026-11-08",
  location: "Ubud, Bali",
  venue: "Venue name",
  summary: "A short factual description.",
  status: "open", // open | interest | full | cancelled
  registrationUrl: "https://example.com/register"
}
```

No event is published until its title, dates, timezone, location, audience,
capacity/availability wording, facilitator, price status, cancellation terms, and
registration destination are confirmed.

## Content guardrails

The pages preserve Rainbow Sanctuary's spiritual worldview while avoiding claims
that could be read as medical diagnosis, biological DNA modification, guaranteed
healing, guaranteed fortune, or a replacement for licensed care. DNA Activation
is explicitly described as symbolic spiritual language rather than a biological
intervention.

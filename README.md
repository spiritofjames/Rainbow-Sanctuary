# Rainbow Sanctuary

Responsive website prototype for Rainbow Sanctuary, including the complete page set, shared navigation, visual assets, responsive hero media, legal and safeguarding pages, and the approved design and voice references. It now includes confirmed program pricing, a $20 Online Group Healing entry offer, the sequential Spiral client journey, a dedicated Earth Healing Zone, a three-path Private Healing area, application-first intake, and a filterable Events & Retreats calendar. The October 2026 Awakening Your Inner Light retreat has a dedicated interest-only page pending final legal and safety confirmations.

## Live preview

https://rainbow-sanctuary-team-preview.vercel.app/

## Design-system references

- [`docs/DESIGN.md`](docs/DESIGN.md) — visual system, tokens, responsive behavior, components, motion, and accessibility
- [`docs/VOICE.md`](docs/VOICE.md) — brand voice and content guardrails
- [`docs/PRIVATE-HEALING-AND-EVENTS-FUNNEL.md`](docs/PRIVATE-HEALING-AND-EVENTS-FUNNEL.md) — information architecture, application funnel, CRM stages, and event data contract
- [`docs/GROUP-HEALING-AND-JOURNEY.md`](docs/GROUP-HEALING-AND-JOURNEY.md) — Group Healing themes, pathway logic, Earth Healing framing, and launch inputs
- [`docs/FINAL-INPUTS.md`](docs/FINAL-INPUTS.md) — remaining configuration and launch inputs
- [`docs/LEGAL-REVIEW-NOTES.md`](docs/LEGAL-REVIEW-NOTES.md) — privacy, consent, and professional-review checklist

## Source format

This repository contains the current HTML/CSS/JavaScript prototype exported from Claude Design. Pages use the `.dc.html` suffix and share the runtime files in the repository root.

## Local preview

Serve the repository as a static directory, then open `Home.dc.html`:

```sh
python3 -m http.server 4173
```

Then visit http://127.0.0.1:4173/Home.dc.html.

## Deployment

The included `vercel.json` contains the routing configuration used by the team preview. Local `.vercel` project metadata is intentionally excluded from version control.

## Current status

This is the approved design prototype and design-system source, not the final production platform. Several standalone offer prices, early-bird rules, payment/refund terms, the secure form/CRM provider, retreat legal and safety approvals, headshot-retention rules, final legal entity details, and selected consent-dependent content remain launch inputs.

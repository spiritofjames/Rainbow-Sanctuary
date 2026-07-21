# Rainbow Sanctuary

Responsive website prototype for Rainbow Sanctuary, including the complete page set, shared navigation, visual assets, responsive hero media, legal and safeguarding pages, and the approved design and voice references.

## Live preview

https://rainbow-sanctuary-team-preview.vercel.app/

## Design-system references

- [`docs/DESIGN.md`](docs/DESIGN.md) — visual system, tokens, responsive behavior, components, motion, and accessibility
- [`docs/VOICE.md`](docs/VOICE.md) — brand voice and content guardrails

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

This is the approved design prototype and design-system source, not the final production platform. Pricing, the live form provider, final legal entity details, and selected consent-dependent content remain launch inputs.

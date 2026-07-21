---
version: alpha
name: Rainbow-Sanctuary-design-system
description: A calm, editorial visual language for a healing academy that explicitly rejects spiritual sensationalism. Built on an ElevenLabs-derived base (off-white canvas, warm near-black ink, soft pastel atmospheric gradient orbs, light-weight serif display type, subtle pill CTAs) and extended with the components this specific site needs — a two-audience hero split, a 4-step Spiral Journey progression, workshop and certification cards, one deliberate dark "mission" band for the Planetary Symbiosis Network, and honest pricing-placeholder treatment.
---

## 0. Brand overview

Rainbow Sanctuary teaches emotional/energetic transformation through a
structured curriculum (the Spiral Journey), specialized workshops, children's
programs, 1:1 healing, and a practitioner certification path — all
positioned as part of a larger civilizational mission (the Planetary
Symbiosis Network). The brand's own stated philosophy: **"We do not create
fear. We do not promise instant transformation. We do not rely on spiritual
sensationalism."**

That line is the single most important design constraint on this project. It
rules out: neon/saturated color, urgency countdown timers, stock photos of
people in ecstatic poses, heavy drop shadows, aggressive pop-ups, or any
visual device that manufactures pressure. It argues for: generous whitespace,
restrained color, soft atmospheric imagery instead of literal photography
where real photos aren't yet available, and typography that reads as
editorial/considered rather than "wellness-marketing loud."

---

## 1. Base tokens (ElevenLabs foundation with approved Rainbow Sanctuary CTA extension)

### Colors
```
canvas:            #f5f5f5   page background
canvas-soft:        #fafafa   alternating band
canvas-deep:        #0c0a09   reserved — see "surface-dark" below
ink (primary):       #0c0a09   headlines and reserved dark surfaces
ink-active:          #292524   dark-surface elevated state
cta-primary:         #5748e8   lotus-violet primary conversion button fill
cta-hover:           #4838d1   primary conversion button hover
cta-active:          #392bb4   primary conversion button press state
cta-focus-halo:      #d9d4ff   soft lavender halo paired with violet outline
body:               #4e4e4e   running copy
muted:              #6f6962   captions, sub-labels
hairline:           #e7e5e4   1px dividers / card borders
hairline-strong:     #d6d3d1
surface-card:        #ffffff   cards
surface-strong:      #f0efed   badges, icon plates
surface-dark:        #0c0a09   reserved for the PSN band ONLY (see §4.7)
surface-dark-elevated: #1c1917
on-primary / on-dark: #ffffff
on-dark-soft:        #a8a29e
gradient-mint:        #a7e5d3
gradient-peach:       #f4c5a8
gradient-lavender:    #c8b8e0
gradient-sky:         #a8c8e8
gradient-rose:        #e8b8c4
semantic-success:     #16a34a
semantic-error:       #dc2626
```

### Typography
- Display: light serif, weight 300 (substitute for licensed Waldenburg: **EB
  Garamond** or **GT Sectra**). Sizes: display-mega 64px (hero only),
  display-xl 48px, display-lg 36px (section heads), display-md 32px,
  display-sm 24px (card-group titles). Never bold a display headline.
- Body/UI: **Inter**. body-md 16px/400/+0.16px, body-strong 16px/500,
  body-sm 15px (footer), caption 14px, caption-uppercase 12px/600/+0.96px
  (section labels), button/nav-link 15px/500.

### Shape, spacing, elevation
- Radius: buttons & badges = pill (9999px); standard cards = 16px;
  atmospheric/orb cards = 24px; form inputs = 8px.
- Spacing scale (4px base): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 96(section).
- Elevation: 1px hairline border + one shadow tier on hover only
  (`0 4px 16px rgba(0,0,0,0.04)`). No heavy shadows anywhere.
- Gradient orbs are atmosphere only — never a button fill, never a text
  color, never a solid card background.
- Primary CTA interaction: use the lotus-violet token with a restrained blur-up
  entrance, a pointer-following white/lavender glow on precise-pointer devices,
  a fine underline that expands on hover, and a right arrow that shifts 5px.
  Touch devices retain the arrow and press state without hover dependence.
  `prefers-reduced-motion: reduce` removes the entrance and movement.

### Logo mark
- Primary digital mark: the supplied full-color lotus, kept in its approved
  colors and proportions with no recoloring, rotation, shadow, or added effects.
- Header treatment: icon plus the existing EB Garamond “Rainbow Sanctuary”
  wordmark on the light canvas. At constrained desktop widths, the icon may stand
  alone while retaining an accessible “Rainbow Sanctuary home” label.
- Favicon and Apple touch icon use compact, transparent derivatives of the same
  lotus artwork with clear space preserved around the outer petals.
- The supplied Canva SVG contains embedded raster artwork; preserve it as the
  approved source asset, but use optimized PNG derivatives in the live interface.

Full component reference (nav, buttons, hero-band, feature-card, pricing
cards, forms, footer) is in `_config/shared/design-system-elevenlabs.md` —
everything below is additive, specific to Rainbow Sanctuary.

---

## 2. Rainbow-Sanctuary-specific components

### `persona-path-card` (two-audience hero split)
Two large cards, side by side, equal visual weight (never primary/secondary
— this site serves two audiences equally per its own mission statement).
- Background: `gradient-orb-card` styling (canvas-soft, 24px radius, 32px
  padding), one card tinted with a mint/sky orb, the other peach/lavender.
- Content: caption-uppercase eyebrow ("FOR HEALING & RENEWAL" /
  "FOR PRACTITIONERS & FACILITATORS"), display-sm headline, 2-3 lines of
  body copy, one pill CTA.
- Mobile: stack vertically, full width, orb still visible but smaller.

### `spiral-level-card` (4-step progression)
A connected 4-card sequence for the Spiral Journey (I → II → III → IV).
- Each card: large numeral (display-sm, ink, weight 300) + level name +
  one-line core purpose + "Ideal for" as 2-3 short tags (pill badges, small,
  surface-strong background) + outcomes as a short bullet list + text-link
  "Learn more."
- Visual connector: a thin hairline (or single gradient-tinted line) running
  left-to-right behind the 4 numerals on desktop, signaling progression —
  not 4 disconnected cards. On mobile, connector becomes vertical.
- Current/recommended level (usually Spiral I for new visitors) gets a
  subtle `surface-strong` background fill; the other three stay
  `surface-card` white — this is the only card-grid in the system where one
  card is allowed to look "selected."

### `workshop-card`
Used in the Workshops & Programs grid and Certification grid (3-up desktop,
1-up mobile).
- `feature-card` base (white, 16px radius, 24px padding, hairline border).
- Content: caption-uppercase category tag (e.g. "WORKSHOP" or
  "CERTIFICATION"), title-md name, 1-sentence core purpose, "Ideal for"
  as 2-3 short phrases, outcomes as 3-4 bullets max (truncate — link to
  full page for more), pill text-link CTA.

### `certification-tier-card`
For the Practitioner & Mentor Certification hub — visually should read as
more substantial/serious than a workshop card (this is the highest-commitment
offer besides 1:1).
- `pricing-tier-card` base (32px padding, 16px radius).
- Adds a caption-uppercase badge top-left ("CERTIFICATION") in
  `surface-strong`.
- Body: what graduates can do afterward (bulleted), not just what they
  learn — career outcome framing matters more here than in workshop cards
  (Persona 3 evaluates this like a professional credential).

### `testimonial-card` (proof-honest variant)
Standard `testimonial-card` base, but **only render this component where
real testimonials exist** (currently: Children & Family only). On every
other page, do not create an empty or placeholder testimonial card — omit
the section entirely rather than leave a visibly empty slot. This is a
content-integrity rule, not just a style rule.

### `pricing-placeholder-badge`
For any offer where price isn't yet confirmed (currently: everything).
- Dashed 1px `hairline-strong` border, `muted` text, `caption` typography,
  small pill shape, background transparent.
- Copy: **"Pricing coming soon"** — never a fake number, never "$XX", never
  hidden entirely. Visitors should never wonder if they missed a price; they
  should see clearly that it isn't published yet.

### `mission-band-dark` (PSN — the one dark section in the whole site)
- Background `surface-dark` (#0c0a09), or a credible regenerative-community
  panorama beneath a strong dark green-black overlay; text remains
  `on-dark`/`on-dark-soft` in a restrained glass editorial panel.
- Reserve this treatment **exclusively** for Planetary Symbiosis Network
  content (the homepage teaser band and the full Bigger Vision page hero).
  Do not reuse the dark band anywhere else — its rarity is what makes it
  read as "this is the larger thing everything else sits inside," per the
  source material's own "[Bigger Vision]" vs. "[Smaller Vision]" framing.
- CTA inside this band is always the `button-outline` variant in white, never
  the solid ink pill (which would visually compete with, not defer to, the
  rest of the site's primary CTA color).
- The Bigger Vision hero image is visibly disclosed as an illustrative future
  vision. It may inspire, but must not imply that a PSN anchor already exists.

### `four-fit-grid` (program-detail orientation)
- Every “This may meet you where you are” section contains four complete cards:
  familiar starting point, pattern worth exploring, readiness to practise, and
  grounding intention.
- Mobile: one stacked column. Tablet: two columns. Desktop at 1040px and above:
  four equal columns in one row. Do not leave a visually empty fourth quadrant.

### `spiral-editorial-sequence`
- Keep the real facilitation photograph on the Spiral Journey overview.
- Spiral I–IV each receive a distinct, disclosed illustrative editorial scene:
  foundations/return to self; relationship/boundaries; discernment/direction;
  and shared leadership/service respectively.
- The Workshops overview retains its own workshop-circle image. No Spiral level
  may reuse that image merely because it also involves learning.

### `mega-nav` (site has grown past a simple top-nav)
- Top-level items: About · The Spiral Journey · Workshops · Children &
  Family · Practitioner Certification · The Bigger Vision · Community.
- Spiral Journey, Workshops, and Practitioner Certification need a dropdown/
  mega-menu on desktop (each has 3-8 sub-pages) — simple single-column
  dropdown, `surface-card` background, hairline border, no icons needed.
- Children & Family, The Bigger Vision, Community stay flat (single link,
  no dropdown — each has ≤3 sub-pages, doesn't need the extra chrome).
- Mobile: standard hamburger; sub-items become an expandable accordion
  within the mobile nav drawer, not a separate screen.

### `persona-tag` (optional wayfinding element)
A small, quiet tag near the top of certain pages, `caption` typography,
`muted` color, no border/fill — e.g. "Best for: those new to energy work" on
Spiral I, or "Best for: experienced practitioners" on Spiral III. Use
sparingly — only where it helps a visitor self-select quickly, never as a
segmentation gimmick. Optional; James/Stephanie should confirm before this
ships broadly.

### `trust-strip` (verified-voices variant)
A compact proof line placed immediately after the Home hero and near the top
of Community & Stories. It uses four overlapping initials by default, a short
source statement, and a link to the full stories.
- Source language must stay specific: four parents and children from the
  Awaken the Supernatural Intelligence workshop, February–March 2025.
- Initials are a complete fallback. Portraits may replace them only when the
  real participant image and web-use consent are both confirmed.
- Never add star ratings, customer counts, publication logos, or a generic
  “trusted by thousands” claim without evidence.
- On mobile, stack the people row over the copy and preserve 44px interaction
  targets. The pattern should read as quiet substantiation, not an ad banner.

### `pastel-motion-hero` (living homepage atmosphere)
An animated evolution of the existing gradient-orb hero treatment, used on
the Home hero only. Two oversized conic-gradient layers rotate in opposite
directions behind the hero content, creating slow atmospheric movement rather
than a visible spinning graphic.
- Palette: use only the existing `gradient-mint`, `gradient-peach`,
  `gradient-lavender`, `gradient-sky`, and `gradient-rose` tokens.
- Motion: linear counter-rotation at 34s and 46s. Do not accelerate this to a
  conspicuous 8–10s loop; the movement should be felt before it is noticed.
- Treatment: 22–32% layer opacity, 88px blur, slightly reduced saturation, and
  a soft white radial veil behind the headline to preserve legibility.
- Content: headline, introduction, and `persona-path-card` elements always sit
  above the animated layers. Cards use a 58% white glass surface with subtle
  backdrop blur and a translucent white hairline.
- Interaction: all atmosphere layers use `pointer-events: none` and
  `aria-hidden="true"`.
- Accessibility: `prefers-reduced-motion: reduce` stops both animations and
  retains a composed static gradient.
- Scope: do not repeat the rotating treatment across every page hero or inside
  buttons/cards. Its rarity keeps the homepage alive without making the brand
  feel restless or visually sensationalized.

### `cinematic-nature-hero` (Home reveal variant)
The Home hero may layer one restrained nature reveal beneath the established
pastel atmosphere. This is an evolution of `pastel-motion-hero`, not a switch to
dark agency styling.
- Motion: one muted 8–12 second pullback or reveal that plays once and settles;
  do not loop a visible camera reset or create perpetual attention pressure.
- Treatment: low-saturation nature footage beneath a warm white/pastel veil. Keep
  EB Garamond display typography, near-black text, equal audience cards, and the
  existing Rainbow Sanctuary palette. Do not import black/orange agency tokens.
- Glass: audience cards may use their existing soft white blur. Maintain readable
  contrast over every frame rather than relying on the opening poster alone.
- Delivery: separate desktop and mobile crops, H.264 without audio, `playsinline`,
  `preload="metadata"`, and a still poster. Target approximately 3–5 MB desktop
  and 1–2 MB mobile.
- Control: provide a visible pause/play button while motion is active. With
  `prefers-reduced-motion: reduce`, do not load visible motion; retain the composed
  still image and pastel treatment.
- Scope: Home only. Program pages continue using their editorial image system.

---

### `founder-story-editorial` (About Stephanie)
- Mobile-first narrative layout that turns sourced biography copy into four
  numbered chapters without inventing credentials, outcomes, or a polished
  mythology unsupported by the interview.
- Follow with one atmospheric pastel quote band, three belief cards, a visual
  Information → Energy → Physical Reality flow, and a clearly separated ethical
  guardrails card.
- Use the real Stephanie portrait once in the hero. Do not repeat it decoratively
  through the page or replace program-context photography with the headshot.
- Finish with one two-path CTA panel: begin with Spiral I or book a consultation.
- Keep all cards single-column on mobile; journey cards may become 2×2 and belief
  cards 3-up only when the viewport supports comfortable reading widths.

## 3. Page-type templates

| Page type | Primary components | Example pages |
|---|---|---|
| Hub/landing | `hero-band`, `persona-path-card` or `workshop-card` grid, `cta-band` | Home, Workshops hub, Children & Family hub |
| Curriculum detail | `spiral-level-card` (single, expanded), bullet sections, `pricing-placeholder-badge` | Spiral I–IV |
| Offer detail | `workshop-card` (expanded/single), bullet sections, `pricing-placeholder-badge` | ReGeneration, Earth Healer Training, etc. |
| Certification | `certification-tier-card`, career-outcome bullets, `pricing-placeholder-badge` | Practitioner Certification hub |
| Mission | `mission-band-dark` hero, standard light sections below for detail | The Bigger Vision |
| Proof | `testimonial-card` grid — only where real testimonials exist | Children & Family, Community |
| Conversion | `text-input` + `button-primary`, minimal fields | Book a Consultation |

---

## 4. Do's and Don'ts (Rainbow-Sanctuary-specific, in addition to the base system's)

**Do**
- Give the two-audience split (Healing & Renewal / Practitioners) exactly
  equal visual weight everywhere it appears.
- Use `pricing-placeholder-badge` honestly and consistently — never mix real
  numbers and placeholders inconsistently across pages.
- Reserve `mission-band-dark` for PSN content only.
- Let Stephanie's own quoted language (from the interview) appear as-is in
  pull-quotes where the copy doc calls for it — don't smooth her phrasing
  into generic marketing voice.
- Build from the phone layout first: single-column content at 390px, 20px
  page gutters, 16px form controls, and no horizontal scrolling. Expand into
  multi-column grids only when the content has room.

**Don't**
- Don't invent testimonials, star ratings, or "X,000 students" style social
  proof numbers anywhere they aren't confirmed.
- Don't use urgency devices (countdown timers, "only 3 spots left," flashing
  badges) — directly contradicts "we do not create fear."
- Don't let the dark PSN band bleed into more than one homepage section —
  its rarity is the point.
- Don't design a payment/checkout flow yet — every CTA currently routes to a
  consultation/contact step, not a purchase, until pricing exists.

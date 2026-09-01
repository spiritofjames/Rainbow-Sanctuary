# Awakening Academy Children’s Pathway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a parent-first, safeguard-aware Awakening Academy pathway with a four-day Foundation Journey as the first child programme step, then release the verified work to protected staging only.

**Architecture:** Keep `/children-and-family` as the parent trust route and transform `/unlock-the-potential` into the Academy roadmap. Add a focused `/awakening-academy-foundation` route that uses the existing parent-led enquiry contract rather than inventing live cohort, payment, Zoom, or provider operations. Existing static publishing regenerates discovery artifacts from the route map.

**Tech Stack:** Design Components HTML, vanilla CSS/JS runtime, Vercel rewrites, Node test runner, Python site validator, existing HubSpot intake taxonomy, static discovery generator.

---

## File structure

- `Children-Family.dc.html` — parent trust page and pathway routing.
- `Unlock-The-Potential.dc.html` — master Academy roadmap.
- `Awakening-Academy-Foundation.dc.html` — new Foundation conversion page.
- `Awakening-Academy-Level-1.dc.html` — new Level 1 roadmap page.
- `Awakening-Academy-Level-2.dc.html` — new Level 2 roadmap page.
- `api/_lib/hubspot-intake.mjs` — canonical programme label for the Foundation enquiry.
- `scripts/publish-discovery-layer.mjs` — Foundation public route and discovery metadata.
- `vercel.json` — Foundation legacy redirect and canonical rewrite.
- `persona-faqs.js` — Foundation-aware parent FAQs.
- `tests/awakening-academy-pathway.test.mjs` — public content, route, CTA, and claims-policy regression contract.
- `tests/hubspot-intake.test.mjs` — new programme taxonomy regression contract.

### Task 1: Lock the parent-enquiry taxonomy

**Files:**
- Modify: `api/_lib/hubspot-intake.mjs`
- Modify: `tests/hubspot-intake.test.mjs`

- [ ] Add `awakening-academy-foundation → Awakening Academy — 4-Day Foundation Journey` to `PROGRAM_LABELS`.
- [ ] Add a test using an ordinary `reason=family` submission and assert the precise HubSpot programme label and source URL remain intact.
- [ ] Run `node --test tests/hubspot-intake.test.mjs`; expect all assertions to pass.
- [ ] Commit with `feat: classify awakening academy foundation enquiries`.

### Task 2: Add the Foundation route and discovery contract

**Files:**
- Create: `Awakening-Academy-Foundation.dc.html`
- Modify: `scripts/publish-discovery-layer.mjs`
- Modify: `vercel.json`

- [ ] Add a route-map entry from `Awakening-Academy-Foundation.dc.html` to `/awakening-academy-foundation`.
- [ ] Add a Vercel legacy redirect from the filename and a canonical rewrite from `/awakening-academy-foundation` to the filename.
- [ ] Build the new Foundation page with the existing offer-page components, one primary CTA to `/apply?reason=family&program=awakening-academy-foundation`, age 5–15, guardian requirements, online-first delivery, four day modules, practical preparation, and no invented operational details.
- [ ] Run `node scripts/publish-discovery-layer.mjs`; expect generated sitemap and LLM discovery files to contain the canonical route.
- [ ] Commit with `feat: add awakening academy foundation journey`.

### Task 3: Rebuild the parent trust page

**Files:**
- Modify: `Children-Family.dc.html`
- Modify: `persona-faqs.js`

- [ ] Replace generic child-support language with whole-child conscious education positioning.
- [ ] Route the child pathway card and the primary CTA to the Foundation page; retain a clearly separate adult coach-certification card.
- [ ] Add six pillars, safeguarding facts, a compact pathway preview, and parent-ready FAQs without diagnostic, clinical, or guaranteed-ability claims.
- [ ] Use a single primary CTA label: `Explore the 4-Day Foundation`.
- [ ] Commit with `feat: clarify children and family academy pathway`.

### Task 4: Add the two progression pages

**Files:**
- Create: `Awakening-Academy-Level-1.dc.html`
- Create: `Awakening-Academy-Level-2.dc.html`
- Modify: `scripts/publish-discovery-layer.mjs`
- Modify: `vercel.json`

- [ ] Add public routes `/awakening-academy-level-1` and `/awakening-academy-level-2`, including legacy filename redirects and canonical rewrites.
- [ ] Build Level 1 around inner awareness, discernment, creative expression, living-world connection, and grounded energetic boundaries.
- [ ] Build Level 2 around three energetic centres, heart–mind coherence, emotional alchemy, nature consciousness, sacred geometry, space harmony, and collective responsibility.
- [ ] On both pages, route new families to the Foundation Journey and state that Level progression follows the parent review. Do not add dates, fees, provider links, or outcome guarantees.
- [ ] Run `node scripts/publish-discovery-layer.mjs`; expect all three Academy routes in generated discovery output.
- [ ] Commit with `feat: add awakening academy level pages`.

### Task 5: Turn Unlock the Potential into the Academy roadmap

**Files:**
- Modify: `Unlock-The-Potential.dc.html`

- [ ] Replace the existing generic Levels I–II presentation with the full approved sequence: Foundation, parent review, Level 1, Level 2, Certificate of Accomplishment, Awakening Community.
- [ ] Explicitly state that the child certificate is not an academic, professional, therapeutic, or practitioner qualification.
- [ ] Preserve spiritual voice through experiential language while avoiding statements of guaranteed psychic, healing, academic, or environmental outcomes.
- [ ] Make the Foundation page the only dominant CTA; route supporting links to the Foundation or parent page.
- [ ] Link every roadmap stage to the Foundation, Level 1, or Level 2 page as appropriate.
- [ ] Commit with `feat: add awakening academy roadmap`.

### Task 6: Add regression coverage before full validation

**Files:**
- Create: `tests/awakening-academy-pathway.test.mjs`
- Modify: `tests/hubspot-intake.test.mjs`

- [ ] Assert all five public pages contain the agreed route relationships and the Foundation parent-intake query.
- [ ] Assert the Foundation contains age, guardian, online-first, and four-module disclosure.
- [ ] Assert the child journey contains the parent review, Certificate of Accomplishment boundary, and ongoing community.
- [ ] Assert prohibited guarantees and clinical promises are absent from the new child-pathway pages.
- [ ] Run `node --test tests/awakening-academy-pathway.test.mjs tests/hubspot-intake.test.mjs`; expect PASS.
- [ ] Commit with `test: cover awakening academy pathway`.

### Task 7: Verify, stage, and present

**Files:**
- Modify only generated discovery artifacts if `npm run validate` changes them deterministically.

- [ ] Run `npm run validate`; expect tests, email checks, static validation, discovery generation, and clean generated diff checks to pass.
- [ ] Run `git diff --check` and a clean merge simulation against current `staging`.
- [ ] Create a pull request to protected `staging`; wait for its quality and preview checks.
- [ ] Merge only when mergeability is clean and checks are successful. Do not promote to `main`.
- [ ] Inspect staging on desktop and mobile: nav, page routes, primary CTAs, external form handoff, image alt text, and no runtime click blockers.
- [ ] Return the staging URL and parent-journey acceptance checklist to James.

# Phase 4 — Website completion

## Release rule

Phase 4 is the mandatory staging acceptance gate for Rainbow Sanctuary.
Nothing moves from `staging` to `main` until every required check below has
passed, blocking defects are resolved, and the release owner records approval.

Use `https://staging.rainbowsanctuary.life` for all review. Record evidence as a
link, screenshot, test result, or concise observation. A blank item is not a
pass. Use `N/A` only with a written reason and named approver.

## Acceptance record

- Candidate commit:
- Vercel staging deployment:
- Review started:
- Review completed:
- Release owner: James
- Content/operations reviewer:
- Technical reviewer:
- Privacy/legal reviewer:
- Accessibility reviewer:

## 1. Content and language

- [ ] Every public page has been reviewed for accuracy, clarity, spelling, and tone.
- [ ] Program names, dates, times, prices, locations, and facilitator details agree
      across pages.
- [ ] Health, healing, spiritual, and outcome language stays within the approved
      wellbeing scope and makes no unsupported guarantees.
- [ ] No internal notes, placeholders, test content, or obsolete offers are visible.
- [ ] Legal entity, contact details, policies, and team descriptions are correct.
- [ ] Final content approval recorded.

Evidence / findings:

## 2. Mobile responsiveness

- [ ] Critical journeys pass at 320, 375, 390, 768, and desktop widths.
- [ ] Navigation, menus, cards, media, tables, forms, and dialogs do not overflow.
- [ ] Text remains readable without horizontal scrolling or zooming.
- [ ] Tap targets, focus states, sticky elements, and orientation changes work.
- [ ] iOS Safari and Android Chrome receive a representative device check.

Evidence / findings:

## 3. Forms and enquiry flows

- [ ] Every public form submits successfully in staging.
- [ ] Required fields, validation messages, consent controls, and error states work.
- [ ] Success states clearly explain what happens next and expected response timing.
- [ ] Submissions reach the approved destination without exposing sensitive data.
- [ ] Duplicate submission, retry, spam protection, and provider-failure behavior are
      tested.
- [ ] Test records are identified and removed or retained according to policy.

Evidence / findings:

## 4. Workshop and event journeys

- [ ] Visitors can discover, understand, select, and enquire or register for each
      published workshop and event.
- [ ] Dates, visitor-local times, availability, prerequisites, prices, and locations
      remain consistent from discovery through confirmation.
- [ ] Group Healing, retreat, workshop, private-healing, and program pathways link to
      the correct next step.
- [ ] Sold-out, unavailable, cancelled, and missing-date states behave safely.
- [ ] Calendar, confirmation, reminder, and operational handoff behavior is verified.

Evidence / findings:

## 5. Payment flows

- [ ] Only provider test mode and approved synthetic identities are used.
- [ ] Successful, declined, cancelled, abandoned, duplicate, and retried payments are
      tested.
- [ ] Price, currency, fees, refund/cancellation language, and final amount agree.
- [ ] A successful payment creates exactly one expected booking or operational record.
- [ ] No payment secrets or full payment-card data enter the website, logs, or CRM.
- [ ] Refund and reconciliation procedures have named operational owners.

Evidence / findings:

## 6. SEO and social sharing

- [ ] All 36 clean routes return HTTP 200 with unique titles and descriptions.
- [ ] Canonical URLs, robots directives, Open Graph, Twitter cards, and images are
      correct.
- [ ] Organization, WebSite, WebPage, FAQ, and Event JSON-LD validate where applicable.
- [ ] `sitemap.xml`, `robots.txt`, `llms.txt`, and `llms-full.txt` are accessible and
      accurate.
- [ ] Legacy `.dc.html` URLs permanently redirect to the intended clean routes.
- [ ] Representative links preview correctly in social-sharing validation tools.
- [ ] Sitemap submission ownership is confirmed for Google Search Console and Bing
      Webmaster Tools.

Evidence / findings:

## 7. Cookies, privacy, and consent

- [ ] Every cookie, browser-storage item, analytics tool, embedded service, and form
      processor is inventoried.
- [ ] Non-essential tracking does not run before valid consent where consent is
      required.
- [ ] Accept, reject, granular choice, withdrawal, and remembered-choice behavior work.
- [ ] Privacy, cookie, terms, wellbeing, safeguarding, and accessibility notices are
      current and linked at the point of relevance.
- [ ] Form and marketing consent are separate, specific, understandable, and recorded.
- [ ] Data minimization, retention, deletion, processor, and cross-border decisions
      have qualified human approval.

Evidence / findings:

## 8. Performance

- [ ] Representative Home, About, Programs, Events, and conversion pages are tested on
      mobile and desktop.
- [ ] Images and video are appropriately sized, compressed, lazy-loaded, and stable.
- [ ] There are no critical console errors, failed assets, redirect loops, or avoidable
      render-blocking resources.
- [ ] Core Web Vitals or equivalent lab results are recorded with agreed thresholds.
- [ ] Performance remains acceptable on a throttled mobile connection.

Evidence / findings:

## 9. Accessibility

- [ ] Keyboard-only navigation completes every critical journey.
- [ ] Focus order and focus visibility are logical; no keyboard traps exist.
- [ ] Headings, landmarks, labels, instructions, errors, and status messages are
      programmatically understandable.
- [ ] Images have appropriate alternative text and decorative images are ignored.
- [ ] Color contrast, zoom to 200%, reflow, reduced motion, and text spacing are tested.
- [ ] An automated WCAG scan and a representative screen-reader review are recorded.
- [ ] No unresolved critical or serious accessibility defects remain.

Evidence / findings:

## Defect gate

- [ ] No Severity 1 defect: security/privacy incident, harmful content, payment/data
      loss, or critical journey unavailable.
- [ ] No Severity 2 defect: major feature unusable, material accessibility barrier,
      incorrect price/date/policy, or broken conversion journey.
- [ ] Lower-severity accepted defects have an owner, due date, and written release
      rationale.

Open defects / accepted exceptions:

## Final approval

- [ ] Automated `validate-static-site` check passes for the candidate commit.
- [ ] Vercel staging deployment is Ready.
- [ ] All sections above are complete with evidence.
- [ ] Content/operations reviewer approves:
- [ ] Technical reviewer approves:
- [ ] Privacy/legal reviewer approves:
- [ ] Accessibility reviewer approves:
- [ ] James explicitly authorizes merging `staging` into `main`:

Final decision: `NO-GO` until every required approval above is recorded.


# Karma price design consistency - 3 November 2026

Owner requested the established Spiral III price-card visual language for Private Healing, without inventing an early-bird price. Styling-only change for protected staging; production is not authorized.

- Karma's hero price is now the existing `rs-offer-price-card` component with one `rs-price-standard` entry: **Private session / USD 500**.
- A single-column modifier removes the unused discount column while preserving the shared radius, border, typography, padding, theme accent and responsive full-width behavior.
- Removed the non-interactive price styled as a pill button. There is no early-bird label, discount, deadline or extra booking action.
- Existing Book this session, secondary questions link, price, payment destination, consent, form/backend/email behavior and closing booking card are unchanged.
- Canonical brand references are `docs/DESIGN.md` (tokens and visual direction) and `docs/VOICE.md`. No separate mood.md or tokens.md exists; no new brand rules were invented. Older unconfirmed-pricing statements in the design document are historical and do not override the approved USD500 fee.

Verification: **278 tests pass**, zero failures, 28 email templates/contracts, 66 HTML pages, 358 public files and release checks. Generated Karma Markdown remains readable. Browser checks at1280px,390px and320px show one price column, no horizontal overflow and no early-bird content. Temporary browser viewport reset.

Only the Karma page, shared single-card CSS modifier, generated Karma Markdown, a focused three-test regression file and this note change. No production, provider configuration, CRM/email records or charges. The new homepage remains a separate unmerged branch; restoring its local worktree is not staging approval for that homepage.

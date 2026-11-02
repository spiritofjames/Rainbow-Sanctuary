# New Initial Home Page — isolated staging workstream

The new Rainbow Sanctuary identity homepage is held on
`codex/new-initial-home-page`, with a draft pull request targeting `staging`.
Do not merge or promote it to production without James's separate approval.

This workstream includes the homepage copy, layout, approved photographs,
symbolic artwork, discovery output, native interactions and regression tests.
The existing programmes experience remains available at `/explore`.

## Separate website updates

`staging` already includes the earlier identity-homepage prototype. A blanket
`staging` → `main` merge would therefore include that homepage, even without
this branch's latest refinements.

Website changes that must ship without the new homepage should start from
the current production `main` baseline in a separate worktree. Review only
those scoped changes and their protected preview; do not merge this homepage
branch or the entire staging branch into that release.

The initial separate workstream is `codex/website-updates-20261102`. Its initial
tree is identical to the fetched `main` baseline. No homepage changes are
copied into it.

## Verification at save

The homepage quality preflight passes 272 tests, validates 67 HTML pages,
checks 27 email templates and 27 disabled automation contracts, and packages
376 public files without source/server exposure. Local browser checks cover
320, 390, 768 and 1440px widths, message copying, mobile menu dismissal and
the separate contact invitation. These are not production acceptance or a
human accessibility/privacy/legal certification.

No email, CRM, payment, form-provider or production changes are part of this
branch-separation task.

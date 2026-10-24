# James story and full-song production release — 24 October 2026

## Approval and immutable source

James explicitly requested “Okay, push it to production, please” after the song-copy correction handoff. This restored the paused release workflow and authorized the bounded staging-to-main promotion.

- Staging candidate: `f6255adce2277bc45d9abc973d97d4bb5b510580`.
- Staging deployment: `dpl_4MAfyV9hk5XXrexzW4e2yk7LM8kW`, Ready and exact SHA matched.
- PR176: story layout, full first-party audio and matching policy/build/test changes.
- PR177: exact owner-supplied recording introduction and matching player note, HTML and generated Markdown only.
- PR178: protected staging-to-main promotion, merged 24 October 2026 at 21:02:10 UTC.
- Production commit: `7a7d7e1eeaf313e152d8c126b0952c89054af286`.
- Production deployment: `dpl_CSA7TteHJdKvvf1fbiXQC4PECW6P`, Ready; public domain matched the exact commit.
- Previous production/rollback: `53b950ea4569610c7c7fee925cc095519a44191d`, deployment `dpl_Brv5u2Ph2zrJxSn6HtXweNEqm4fF`.

Main was already an ancestor of the staging candidate, so the required main-to-staging merge was a no-op. No unrelated application changes were included; prior production release documentation was retained.

## Acceptance and verification

- Fresh full quality gate passed: 252 tests, 66 HTML pages, 27 email templates and 27 disabled automation contracts, 25-file release integrity and 358-file public packaging. Generated output reproducible and worktree clean.
- Required PR Site quality and Vercel checks green, no unresolved review threads. Post-merge staging Site quality run `40130821815` and production Site quality run `40132435474` succeeded.
- Protected staging and live production desktop at 1280px and mobile at 390px reviewed without horizontal overflow. Live desktop portrait and copy each 710.39px high; song block spans 1180px beneath both.
- Exact approved introduction visible: “A song I recorded during one of the ceremonies after my initiation, carrying something of that experience into everyday life.” Player note: “Recorded during a ceremony after my initiation.” Public Markdown matches.
- Full owner-supplied song duration is 359.097021 seconds (5:59). Production first-click playback reached 68.09 seconds; audio readyState 4, no media error, other page audio remained paused. Playback was left paused and seek reset to zero. Earlier staging evidence verifies longer playback and keyboard controls.
- First-party audio uses preload none and no autoplay. Optional Spotify navigation remains a separate link; obsolete Spotify loading script is absent.
- Production endpoint monitor passed: homepage, representative programme/conversion routes, December retreat, sitemap, robots, llms.txt, canonical domain and legacy redirects. Anonymous staging still requires Vercel authentication.
- Additional live checks cover apply/legal pages, llms-full.txt, corrected Markdown, repository-source 404s, exact published HTML, HTTPS/CSP and audio HTTP206 range delivery.
- Screenshots and detailed acceptance evidence retained in PSN `output/james-story-player-2026-10-24/`: `production-desktop.png`, `production-mobile-player.png`, and `PRODUCTION-ACCEPTANCE.md`.

## Boundaries and accepted exceptions

No event schedules, prices, payments, form routing, consent controls, provider settings or customer data changed. No live enquiries, CRM writes, emails or payments were submitted. Existing tested journeys remain unchanged. Prior owner-accepted missing qualified human privacy/legal, accessibility certification and physical iOS/Android reviews remain explicit exceptions, not passed checks. Automated validation is not medical, legal or accessibility certification. James's story is attributed personal experience, not an independent guest review or guaranteed outcome.

A prior procedural receipt-sequencing incident affected only a push of the exact two copy files to the named feature branch. It caused no production/staging mutation or sensitive-data exposure. The owner approved restoration; subsequent material actions were gated before execution. Audit detail remains in the private workspace evidence, not public website output.

## Outcome

Production verified. No rollback required. This documentation follow-up starts from the verified main commit and targets staging to preserve the production baseline for the next release; it does not alter public content or provider configuration.

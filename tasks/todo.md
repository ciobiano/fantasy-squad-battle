# MVP plan: Fantasy Squad Battle

The decisions behind this plan are in [CLAUDE.md](../CLAUDE.md) under "Decisions".

**Scope update (2026-10-10):** the app now has two halves, league banter and free FPL tools, on one data layer. See "Scope update" in CLAUDE.md.

**Waiting on Ralph:**
- league IDs (Phase 2 testing uses public league 314 until then)

**After the design branch and ours are both on main** (from the design session's 12 Oct handoff):
- `lib/league` imports `AwardKey` (`lib/awards`) and `lib/roasts` imports `Lang` (`lib/i18n`), replacing our copies
- move `start-input.ts` and `resolveGameweek` from `lib/fpl` into `lib/league`, and use `fplId` from `lib/ids.ts`
- add ESLint import rules for `lib/fpl`, `lib/league`, `lib/roasts` and `lib/tools`

## 0. Setup and risk check
- [x] `git init` and a private GitHub repo: github.com/ciobiano/fantasy-squad-battle
- [x] Next.js 16.3.8 with the App Router, TypeScript, Tailwind, CVA, clsx and Vitest. Inter and Instrument Serif come through `next/font`.
- [x] `lib/fpl/http.ts`:
  - browser-like headers
  - a guard that refuses any path outside FPL's `/api/`
  - backoff retry on 403, 429 and 5xx responses and on network errors
  - 11 unit tests
- [x] `/api/health` checks bootstrap, fixtures, standings and dream-team. It passed locally on 2026-10-08.
- [x] Vercel project `fantasy-squad-battle` is linked and connected to GitHub. Production is at fantasy-squad-battle.vercel.app.
- [x] **Spike result (2026-10-08):** FPL's Fastly sends a 403 to *some* Vercel server IP addresses, depending on the deployment rather than the region.
  - Blocked: one `lhr1` deployment, and 1 of 2 `cdg1` deployments.
  - Fine: `iad1`, `fra1`, `dub1`, `cpt1`, and the other `cdg1` deployment.
  - Region set to `cdg1`, the fastest.
- [x] **Fallback:** the Cloudflare relay `fsb-fpl-relay` is deployed and locked.
  - Checked: no key gets 401, a path outside the list gets 404, a non-GET gets 405, and all 7 FPL endpoints return 200.
  - End to end: a blocked `cdg1` preview served every probe through the relay, and the next call skipped the direct attempt.
- [ ] Merge to `main` so production gets the relay and the `cdg1` region. Needs Ralph's OK.
- [ ] Before launch: remove `/api/health`, or rate-limit it with Vercel Firewall

## 1. Data layer: `lib/fpl/` (the only module that touches the API)
- [x] `parseLeagueInput`: a raw ID or a league URL. Head-to-head, draft and invite links each get a clear error.
- [x] zod schemas for the 7 endpoints, covering only the fields we use. Tested against trimmed, anonymised real GW5 responses in `lib/fpl/__fixtures__/`.
- [x] Cached getters (`lib/fpl/api.ts`) using `'use cache: remote'`:
  - bootstrap: hourly
  - provisional data: 5 minutes
  - final GW data: kept for good
  - a 404 comes back as `null` (see CLAUDE.md on errors and `'use cache'`)
- [x] Gameweek status (upcoming, live, provisional, final) and the default gameweek: the newest one with unlocked cards
- [x] `getLeagueGameweek`: one cached bundle per league and GW.
  - 6 requests at a time, top 50 managers.
  - Late joiners get `picks: null`.
  - An unknown league is a result, not an error.
- [x] Local production check: a cold load takes 6.7 s from Lagos (about 100 FPL calls); a warm one takes 7–12 ms. The bundle is 145 KB.
- [x] Vercel preview (`cdg1`, Runtime Cache), league 314 with 50 managers: cold load 634–988 ms, warm load 27–29 ms. An unknown league returns `league-not-found`.
- [ ] Before launch: remove `/api/league/[leagueId]` (the inspection endpoint), or rate-limit it

## 1b. More FPL readers: `lib/fpl/` (done 2026-10-11)
- [x] Start input (`lib/fpl/start-input.ts`, which replaces `league-input.ts`): a team ID, a team link (`/entry/{id}/…`), a league ID or a league link. A bare number follows the mode the person picked; links decide for themselves.
- [x] `getEntry(teamId)`: team name, first name (surnames are never read) and every classic league. `null` for an unknown team.
- [x] `getMyTeam(teamId)` (`lib/league/my-team.ts`): the league-picker list. Player-made leagues come first, smallest first, so friend groups lead; FPL's own leagues follow. Ranks of 0 become `null`.
- [x] `getPlayerSummary(playerId)`: fixtures ahead and gameweek history for player pages
- [x] Tool fields in the bootstrap schema: status, news, chance of playing, stats, form (`ep_next`), transfers, prices and team strengths.
  - They're tolerant: a changed or missing tool field becomes `null` with one warning instead of breaking league pages.
  - The trimmed bootstrap is 515 KB, down from 1.78 MB raw.
- [x] The league bundle keeps slim player objects, so it stays about 145 KB.
- [x] The relay allows `element-summary` (redeployed 2026-10-11). It still refuses login-only endpoints such as `my-team`.
- [x] Local production check: `/api/team/{id}` takes 658 ms cold and 2 ms warm. An unknown team returns `team-not-found`. 113 tests pass.
- [x] Vercel preview (`cdg1`): `/api/team/{id}` takes 167 ms cold and 11 ms warm. An unknown team returns `team-not-found`. The league bundle is still about 145 KB.
- [ ] Before launch: remove `/api/team/[teamId]` (the inspection endpoint), or rate-limit it

## 2. Domain logic: `lib/league/` (done 2026-10-11)
- [x] Language-free view types (`lib/league/types.ts`, D2). `getLeagueView(leagueId, { gw, now, youId })` runs on every request, straight from the cached bundle (D1).
- [x] Net GW score and breakdown ("67 (71 −4)"); first names only ("valentine chukwu" → "Valentine")
- [x] League rank at every GW from season totals; equal totals share a rank, 1, 2, 2, 4 (D5)
- [x] Market list: GW rank, league rank change, gap to the league average for every GW, award tags, `isYou`
- [x] Table view: rank, last rank, movement, total, GW score
- [x] All 8 awards, ties shared, in story order. Awards nobody qualifies for go into `skipped`, for the Wrap's group lines.
  - Oga and Wooden Spoon. The Spoon is skipped when everyone scored the same.
  - Captain Disaster: the chosen captain on 2 points or fewer. Zero minutes counts, with `viceRescued`; Triple Captain counts (D4, D6).
  - Bench Regret and Hit Merchant, read straight from FPL's fields (D6)
  - Climber and Faller, skipping anyone with no previous GW (D5)
  - Middle Class: middle third of the table, rank moved 1 place or less over 3 GWs (D3)
- [x] Team of the Week, with ownership counted across the league's squads
- [x] 30 new tests: 26 rule by rule and 4 end to end on real GW5 samples (143 in the suite)
- [x] Real-data check (league 314, top 50):
  - GW5 view: 4.8 s cold from Lagos, 17 ms warm
  - GW1: **42 of 50 managers shared Captain Disaster** (all captained Fernandes, 2 pts), so Phase 3 needs a group roast for mass ties
- [x] Vercel preview (`cdg1`): the league view takes 1.4 s cold and 43–57 ms warm. `you=` marks the visitor's row; an unknown league returns `league-not-found`.
- [x] **Asked by the design session (13 Oct):** Captain Disaster's best other player (`captain.best`), Bench Regret's bench players (`bench`), and each manager's league rank after every GW (`MarketRow.rankSeries`). 3 new tests.
  - Checked on league 314, GW1, GW5 and GW6 (preview): every bench list adds up to FPL's own bench total (22, 26 and 26); each rank series ends on the Table rank.
- [ ] Before launch: remove `/api/league/[leagueId]/view` (the inspection endpoint), or rate-limit it

## 3. Roasts: `lib/roasts/` (done 2026-10-13)
The design session already built titles, language detection and the switcher in its `lib/i18n`, so this phase is the roast lines.
- [x] Award keys match the design session's (`captain`, `bench`, `hits`, `middle`, `spoon`), so cards, URLs and lines share one vocabulary
- [x] About 6 lines per award per language (EN, Pidgin, FR), as templates with placeholders. `book.ts` lists each pool and its placeholders.
- [x] Pools fit the facts: one winner, 2–3 named, a crowd of 4+, plus special pools (captain didn't play, vice rescue, Triple Captain, one shared captain, new leader, fall from the top, last after a hit)
- [x] **Group roast for mass ties:** the `crowd` pool, or `sameCaptain` when they all, or most of a crowd, picked one captain (GW1: 43 tied, 32 of them on B.Fernandes)
- [x] Wrap group lines for skipped awards, with "too early" lines for Climber, Faller (GW1) and Middle Class (before GW3)
- [x] Seeded pick by league + GW + award. A mistyped placeholder skips to the next line instead of breaking the card.
- [x] Interface for the design session: `roastFor(award, ctx)`, `groupLineFor(id, ctx)`, `roastView(view, lang)`
- [x] Tests (149 new, 292 in the suite):
  - every line in every language fills with the longest names a card can meet and stays within 100 characters
  - no guardrail words (appearance, tribe, religion, family, FPL)
  - pool choice, seeding, units, ordinals and lists
- [x] `/api/league/{id}/view?lang=` returns the roasts and group lines, for reading real lines
- [x] Vercel preview, league 314: real lines in all three languages, 43–69 ms warm and about 1 s cold. The GW1 crowd reads "32 managers captained B.Fernandes. B.Fernandes gave them 2 points. Group project failed."
- [ ] **Ralph:** edit `lib/roasts/lines/en.ts` and `pcm.ts`. French stays beta until a native speaker reviews it.

## 3b. Tools logic: `lib/tools/` (done 2026-10-13)
- [x] Shapes as agreed with the design session (`TickerRow`, `InjuryRow`, `InjuryReport`)
- [x] Fixture ticker, `getTicker(weeks = 6)`:
  - FPL difficulty (1–5) per team from the next deadline, fewer weeks at the end of the season
  - blank weeks (`[]`) and doubles (two matches, in kickoff order)
  - `runScore`: a blank counts 6, a double its easier match minus 1. The UI sorts.
- [x] Injuries & bans, `getInjuryReport(now)`: every flagged player, newest first, with status, chance, news and date; every club for the filter
- [x] The fixtures schema reads `team_h_difficulty` and `team_a_difficulty`, tolerant like the other tool fields
- [x] 14 new tests (306 in the suite), on a real 13 Oct snapshot (GW7 next; 197 flagged: 67 injured, 21 doubtful, 4 suspended, 105 unavailable) plus hand-made blanks and doubles
- [x] `/api/tools?weeks=` returns both, for inspection
- [x] Vercel preview (`cdg1`), live FPL: 585 ms cold, 36–63 ms warm. The window is GW7–12; Coventry and Spurs have the easiest run (16); 197 flagged players.
- [ ] Before launch: remove `/api/tools`, or rate-limit it

## Share fix (2026-10-13, Ralph found it)
- [x] Sharing sent a link, not the image: the share call carried a URL beside the file, and WhatsApp on iPhone keeps the link and drops the image
- [x] `lib/share/share.ts`: `shareCard` shares the PNG alone on phones, and saves it on computers (for X, the composer opens with the league's page). It prefetches so the share stays inside the tap, and reports `tap-again` when it couldn't. 8 tests.
- [ ] Design session: redesign the sheet with real WhatsApp and X marks and wire `shareCard` ([handoff](../docs/handoff/2026-10-13-share-image.md))

## 4. Design exploration
- [ ] Claude Design canvas with the **Market** and **Editorial** directions, using Denizens of Olympus GW5 data
- [ ] Show both directions in light and dark, including our own gradient palette (no purple, no glow)
- [ ] Ralph picks a direction, then the Design System artifact gets made: colour tokens for both themes, Inter plus Instrument Serif type scale, and AA contrast checks over gradients

## 5. Cards: `next/og`
- [ ] Wrap and award cards in Status (1080×1920) and X (1080×1080) sizes
- [ ] Bundled font files, Noto or Twemoji emoji, generated team badges and the web address watermark
- [ ] Long-lived cache headers for finished GWs and a short cache for provisional ones

## 6. App UI (mobile-first)
- [ ] Market tab: story circles, then Team of the Week on a pitch, then the Market list with sparklines and rank pills
- [ ] Story viewer: 5 s per card, tap to move, hold to pause, Status or X share, watched state, reduced motion respected
- [ ] League tab: the classic table (Table view)
- [ ] Start screen: a league link **or** your team ID, then pick your league; remembered on the phone *(scope added 2026-10-10; design session)*
- [ ] Fixtures tab: the difficulty ticker *(scope added 2026-10-10; design session)*
- [ ] Players tab: injuries & bans for the first release *(scope added 2026-10-10; design session)*
- [ ] Sharing through the Web Share API with files (for WhatsApp Status), with a download fallback
- [ ] A public share page for each league and GW, with link-preview tags using the Wrapped card
- [ ] Every state covered:
  - idle and loading
  - invalid ID and private league
  - league over 50 managers (labelled)
  - FPL API down
  - GW not started
  - provisional data
  - fewer than 3 GWs, so no Middle Class card

## After launch (scope added 2026-10-10), in order
1. Player stats: a sortable, filterable table (price, ownership, form, points, projected points, xG, xA, xGI, defensive contributions, minutes), then player pages with fixtures ahead and gameweek history
2. Projections: our own model from free data (D7). FPL's `ep_next` is shown as "Form", never as a projection
3. Price changes and transfer trends: FPL's `price_change_projections` and transfers in and out first. Snapshots in a database only if needed.
4. Planner, as its own phase: your squad from your team ID, future fixtures and projections. Selling prices are estimates, labelled, because exact ones need an FPL login.
5. Our own attack and defence fixture difficulty, from team strength ratings

## 7. Analytics
- [ ] PostHog through the Vercel Marketplace: cookieless, EU region, loaded late, the 5 agreed events

## 8. Ship
- [ ] Unit tests for parsing, awards and roasts
- [ ] Accessibility pass (WCAG 2.2: story timing, target sizes, contrast)
- [ ] Smoke test against Ralph's league
- [ ] Vercel preview

## Decision log
- **FPL wrapper vs our own module:** there are maintained wrappers (`fpl-api` 5.0.1, `fpl-fetch`), but we only need about 7 endpoints and Next's per-request `fetch` cache control. So we write a thin module of our own. It's also the single place to change if the API does.
- **Card rendering:** `next/og` is built into Next.js, so no extra dependency.
- **Concurrency:** `p-limit` 7.3.3, a well-tested tiny library, rather than a hand-written pool.
- **Validation:** `zod` 4.6.5. Its schemas also strip unused fields, which keeps cached payloads small.

## Review
_(fill in after the build)_

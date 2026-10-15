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
- [x] Before launch: remove `/api/health`, or rate-limit it with Vercel Firewall — done 2026-10-15, see Phase 8

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
- [x] Before launch: remove `/api/league/[leagueId]` (the inspection endpoint), or rate-limit it — done 2026-10-15, see Phase 8

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
- [x] Before launch: remove `/api/team/[teamId]` (the inspection endpoint), or rate-limit it — done 2026-10-15, see Phase 8

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
- [x] Before launch: remove `/api/league/[leagueId]/view` (the inspection endpoint), or rate-limit it — done 2026-10-15, see Phase 8

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
- [x] Before launch: remove `/api/tools`, or rate-limit it — done 2026-10-15, see Phase 8

## Share fix (2026-10-13, Ralph found it)
- [x] Sharing sent a link, not the image: the share call carried a URL beside the file, and WhatsApp on iPhone keeps the link and drops the image
- [x] `lib/share/share.ts`: `shareCard` shares the PNG alone on phones, and saves it on computers (for X, the composer opens with the league's page). It prefetches so the share stays inside the tap, and reports `tap-again` when it couldn't. 8 tests.
- [ ] Design session: redesign the sheet with real WhatsApp and X marks and wire `shareCard` ([handoff](../docs/handoff/2026-10-13-share-image.md))

## 4. Design exploration
The full spec is in [docs/design/brief.md](../docs/design/brief.md).
- [x] Design brief: every card, screen, state and component, the two directions, Satori limits, and the data each surface needs
- [ ] Fetch Denizens of Olympus GW5 data and swap it into the canvas, with surnames stripped. *Waiting on Ralph for the league ID.* Pass 1 used a sample league with real GW5 player data.
- [x] Draft roast lines for the pass 1 cards (EN, Pidgin, FR), marked as drafts
- [x] Canvas pass 1, to pick a direction ("Squad Battle Directions", 2026-10-09):
  - Market and Editorial: Wrap (Status), Oga (Status), Wooden Spoon (X)
  - The Market tab in light and dark, in each direction
  - Gradient candidates Harmattan and Lagoon, with every text pair checked for AA
  - Checked in the browser; fixed two cards that ran into the Status safe zone and one grey-on-gradient contrast failure
- [x] Ralph picks a direction: **A · Market** (2026-10-09).
- [x] Ralph picks the official gradient: **Mint**, aqua `#35E1E5` to green `#28E4A3`, with grain and a deep-teal wash (2026-10-10). Applied to the canvas and the design system; Harmattan and Lagoon retired.
- [x] **Mist sky** replaces bright Mint (2026-10-10). Bright Mint's aqua was ΔE 4.7 from the Premier League's own cyan (#05F0FF) and its green ΔE 9.7 from PL green (#00FF87), read from premierleague.com's stylesheet. New look from Ralph's reference: deep teal at the top, misty mint, fading into white (light) or black (dark). Every sky and accent colour is ΔE ≥ 16 from the PL palette, chroma ≤ 19.
  - Cards now come in light and dark (canvas v29: 18 new light boards). Every text element checked for AA at its position on the sky.
  - Accent: pale mint #C8EBDD on dark, deep teal #143A53 on light. Start and Market screens get the sky header.
  - [x] Design system v5 (2026-10-11): Mist tokens (sky, accent, ring, you, caution, difficulty 1–5), brand book rules, restyled Button/StoryRing/AwardCard/WrapCard/Cover/TabBar, new Sky, LeaguePicker, FixtureTicker, InjuryList
  - [ ] Ralph: shared image theme. Proposal: the image follows the app theme at share time; link previews use dark
- [x] Middle Class rule: middle third of the table and moved ≤ 1 place over 3 GWs (adopted as D3, 2026-10-10).
- [x] Canvas pass 2, Market direction only, on two new canvas pages (2026-10-09):
  - [x] **Card component** (`A-Card`): all 8 awards in Status and X, with ties, the provisional tag and the language switch. Each award gets its own visual: trend line, rank line, captain bars, bench row, hit bar, flat group lines.
  - [x] **Wrap:** Status and X, plus a version where an award has no winner and a group line takes its row
  - [x] **Screens:** Start, Market tab, League tab, story viewer, share sheet, public share page
  - [x] **States:** invalid ID, league not found or head-to-head, FPL down, loading, provisional, over 50 managers, GW still in progress, fewer than 3 GWs
  - [x] Visual check of every card, screen and state in the browser
- [x] Ralph approves pass 2 (2026-10-10), asking for less text
- [x] Simplicity pass on cards and screens, following Apple's guidance (see tasks/lessons.md)
- [ ] Ralph edits the Pidgin and English copy
- [x] Design System artifact "Fantasy Squad Battle" (2026-10-10): https://claude.ai/artifact/8hkdZjwZq7JvCU4FS7NzYi
  - Tokens for dark (first) and light: 36 colours, all text pairs AA in both themes; Inter App and Card type scales; spacing, radius, size and gradient tokens
  - Brand book as usage rules: voice, colour, type, layout, share cards, iconography, motion, accessibility
  - 18 components with guidelines and live HTML previews, from Button to AwardCard and WrapCard, plus a cover
  - Instrument Serif dropped with the Editorial direction
- [x] **Canvas pass 3, new scope** (2026-10-11), page "Pass 3 · New scope", dark and light, real FPL data:
  - [x] Start with My team ID | League link, help, team-not-found
  - [x] League picker: your leagues, public folded, no private leagues, loading, FPL down
  - [x] Tab bar League · Fixtures · Players; Market | Table switch; Change league; your row and card highlighted
  - [x] Fixtures ticker GW 7–12: sort, sticky team column, difficulty colours plus numbers, double and blank, end of season, loading, FPL down
  - [x] Players, injuries & bans: status chips, filters (Unavailable separate), nothing flagged, loading, FPL down
  - [x] AA checked at each text's position on the sky, both themes
  - [x] Reply to the data session: [docs/handoff/2026-10-11-design-reply-pass3.md](../docs/handoff/2026-10-11-design-reply-pass3.md)
- [ ] Ralph reviews pass 3

## 5. Build, slice 1 (started 2026-10-11): tokens and the share cards
Data isn't wired yet (`lib/league` is in the data session's branch), so cards render from a sample league with the canvas data. The card takes a small view model (`lib/cards/types.ts`) that the award logic will fill later.
- [x] Tokens: `design/tokens.json` (copied from the Design System) → `npm run tokens` generates `app/tokens.css` (light, dark by system preference, `data-theme` overrides, Tailwind mapping) and `lib/tokens.ts` (plain values for cards). `app/globals.css` holds the clamp() type scale. Inter only; Instrument Serif removed.
- [ ] `lib/variants.ts`: CVA variants for the app's base components (with the app screens, slice 2)
- [x] Card assets: Inter 400/600/700 Latin + Latin Extended WOFF from `@fontsource/inter` 5.3.0 (OFL, 240 KB), the 8 award emoji as Noto SVGs (OFL; the CDN set lacks 🫠), a sparse grain tile (`scripts/make-grain.mjs`, 8% speckle)
- [x] `lib/cards/`: view-model types, words per language (`describe` turns facts into number, context and chart message), sky stops, air above the winner, trend and rank charts (rank scale spans the ranks shown; labels kept a line apart), request parsing, sample league. 26 unit tests.
- [x] Card JSX for `next/og` (`lib/cards/render/`): award card and Wrap, Status and X, light and dark, provisional, ties (3 named + "+N others"). Inline style objects and plain `img` there are deliberate: Satori reads neither class names nor next/image. ▲ ▼ are drawn as shapes (the card fonts don't carry them).
- [x] Route `app/cards/[league]/[gw]/[award]/route.tsx` (`award` = wrap or an award key; `?format=status|x&theme=dark|light&lang=pcm|en|fr&provisional=1`). Only `sample/5` until lib/league is wired; others 404. Final GWs: s-maxage 1 day; provisional: 5 minutes.
- [x] Verified (2026-10-11): typecheck, lint, 108 tests, production build (assets traced into the route). All 36 cards (9 × 2 formats × 2 themes) rendered and checked by eye, plus French and provisional. Render 0.15–0.9 s warm.
  - **Size:** dark Status cards are about 400 KB, light about 170 KB, X cards 100–270 KB. The grain costs about 200 KB on a dark card (dense noise made it 1.3 MB; sparse 8% speckle keeps the look). Ralph to decide whether shared cards keep the grain.
- [ ] Wire cards to `lib/league` awards once the data session exposes them (plus `entryId` on winners, per the handoff reply)

## 5c. Build, slice 2 (started 2026-10-12): the app screens
Real data where the data layer already has it (start input, `getMyTeam`, standings); typed samples where the logic belongs to the data session and isn't built yet (Market data, ticker, injuries). Screens take view models (`lib/screens/`), so wiring the real logic later swaps one function per screen.
- [x] Foundations: `lib/variants.ts` (CVA, no arbitrary values: named utilities and variants in `globals.css`), `components/ui/` (Sky, TabBar, theme toggle, language switch, down panel, badge, rank pill, Noto award emoji), theme with no flash (System / Light / Dark, `data-theme`), language from a cookie with the phone's language as the default
- [x] Start `/` (real, no client JavaScript): My team ID | League link as radio segments, help as `<details>`, every `parseStartInput` error in three languages; `/find` redirects to the picker or the league
- [x] Picker `/team/[teamId]` (real `getMyTeam`): your leagues, public folded, team not found → back to Start with the error, FPL down panel, loading skeleton
- [x] Remembered on the phone: `proxy.ts` keeps the last team and league in cookies and opens `/` straight into the last league (`/?start=1` skips it)
- [x] League `/league/[id]` (Market) and `/league/[id]/table`: shared header (Change league, Market | Table), Table on real standings (your row tinted, Top 50 note), Market on `/league/sample` until `lib/league` lands; real leagues show a note and a link to the Table
- [x] Fixtures `/fixtures` and Players `/players` on the agreed `TickerRow` / `InjuryRow` shapes, from a 12 Oct snapshot until `lib/tools` lands; sort and filters are links (no JavaScript)
- [x] Verified (2026-10-12): typecheck, lint, 163 tests, production build (every screen a partial prerender). Real flows checked in the browser at phone size in both themes: Start (mode switch, errors), picker on real team 1, Table on league 314 (Top 50), sample Market, Fixtures, Players, theme toggle, language switch, remembered league.
  - **First-load JS on Start: 178 KB gzipped** (budget ~170). The Next/React runtime is ~164 KB in this build; ours is ~9 KB (next/image for the two card previews, the theme toggle). Ralph to decide: drop the previews or accept.
- [ ] Wire the Market view to `lib/league`, Fixtures and Players to `lib/tools` (one call per screen; see docs/handoff/2026-10-12-screens-ready.md)
- [ ] Story viewer and sharing (next slice)

## 5d. Architecture pass (2026-10-12, agreed with Ralph): deep modules, clear layers
Each step is one commit; the full suite runs once at the end.
- [x] **i18n:** `lib/i18n` owns `Lang`, the language cookie and every word (app and cards), one catalogue per language; `lib/awards.ts` owns the award keys and emoji. Fix the English-only strings on the Market and Fixtures screens.
- [x] **Remembered:** `lib/remembered.ts` owns the cookies and the proxy's decision (tested); `lib/ids.ts` checks an FPL ID once.
- [x] **Screen loaders:** one module per screen in `lib/screens/` (raw input → ready view, redirect, not found or FPL down), the data source passed in; routes only switch on the outcome; components only draw. Tests go through the loaders.
- [x] **Cards:** `renderCard` in `lib/cards` hides Satori (sizes, fonts, emoji, errors); `lib/screens/card.ts` loads the model.
- [x] **Layers:** `docs/architecture.md` plus ESLint `no-restricted-imports` per folder; handoff to the data session for their side.
- [x] Verified (2026-10-12): typecheck, lint (rules probed: each layer's forbidden import fails), 184 tests, production build (every screen still a partial prerender). On the production server: `/find`, bad team → Start with the reason, `/league/abc` → 404, picker on team 1, Table on league 314 (Top 50), Market-soon note, sample Market in French (stories, pills), Fixtures and Players in French with filters, `/prefs` (and refusing `//evil.example`), remembered league 307, cookies, card PNG and cache header, unknown cards 404.

## 5e. Build, slice 3 (planned 2026-10-13): real Market, stories and sharing
Design: canvas `S-Story` (with its share `sheet`), brief §3 and §5. Data: `getLeagueView` from the data session's `feat/league-logic` (not on main yet).
- [x] **Real Market:** `LeagueSource.market` maps `getLeagueView` → `MarketData` (award IDs → our keys, `null` scores and gaps handled, `isYou` row); the Market-soon note goes
- [x] **Real cards:** `loadCard` builds `AwardCardModel` / `WrapCardModel` from the league view (stat and winners → `AwardFacts`, "+N others" for big ties, skipped awards → Wrap group lines)
- [x] **Story viewer** `/league/{id}/story/{card}`: works as plain links with no JavaScript (card, previous and next, close); a small client script adds 5 s auto-advance, progress segments, hold to pause, a visible Pause button, and no auto-advance under reduced motion
- [x] **Watched circles:** grey once seen (localStorage), a tiny script on the Market's story row
- [x] **Share sheet:** WhatsApp Status (tall), X (square), Save image. Web Share with the PNG file where the phone supports it; a download link otherwise
- [x] **Share page** `/s/{league}/{gw}` (public): Wrapped card, award cards, standings, "Roast your own league"; link previews (Open Graph, X) use the dark Wrapped card
- [x] Tests through the screen modules (201 in the suite); JS budget measured on the production build (compressed): the framework's shared chunks are ~170 KB on every page; on top, Start +14 KB (next/image previews, theme, language), League +14 KB (links, theme toggle, story circles 1.2 KB), the story viewer +16 KB on its own page only
- [x] Verified (2026-10-13, dev and production): auto-advance and the URL following, pause, tap zones, last card closing to the league, the share sheet open and Cancel, light and dark cards (only the shown theme downloads, ~40 KB WebP each), watched circles, the share page and its preview tags; bad story and share links are real 404s
- [x] Real Market and real cards (2026-10-13, after PR #2): `getLeagueView` and `lib/roasts` through `lib/screens/from-view.ts`; checked on league 314 GW 6 (Market, stories, cards, share page). Waiting on the data session for the captain's best-in-team, the bench players and a rank series (docs/handoff/2026-10-13-market-wired.md)

## 5f. Wiring the data session's handoffs (2026-10-15)
- [x] Fixtures and Players on live `lib/tools` (`getTicker`, `getInjuryReport`); the 12 Oct snapshot is gone
- [x] Cards: the captain set against the best in that team (`captain.best`), bench players (`winner.bench`), rank charts from `rankSeries`
- [x] Share sheet on `lib/share` (`shareCard`, `createImageCache`, `browserShareEnv`)
- [x] Analytics: five calls (`league_loaded`, `card_viewed`, `language_changed`, `card_shared`, `card_downloaded`). Checked 15 Oct against a local fake PostHog: each event arrives with only its props; bots, link previews, `<Link>` prefetches and re-picking the same language aren't counted. `card_viewed` is a browser event: every card the story player shows, going back included.

## 5b. Cards: `next/og` (original checklist)
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

## 7. Analytics (built 2026-10-15)
- [x] PostHog EU, free plan, signed up directly (the Marketplace plan needed a card)
- [x] `lib/analytics`: server-side capture after the response, daily-rotating anonymous visitors, no cookies, no IP sent, bots and prefetches skipped, the 5 events with strict properties
- [x] `/api/signal`: shares and downloads from the browser (same origin only, ≤ 1 KB, client events only); `track()` is a ~300-byte beacon
- [x] `ANALYTICS_SALT` in Vercel (Production, Preview). 12 new tests (329 in the suite).
- [x] `POSTHOG_KEY` (the public `phc_` project token) in Vercel Production and Preview; PostHog EU accepted a test event (2026-10-15)
- [x] Design session: call `trackServer` and `track` at the five places ([handoff](../docs/handoff/2026-10-15-analytics.md))
- [x] Before launch: rate-limit `/api/signal` with Vercel Firewall — live 2026-10-15 (log only for now); see Phase 8

## 8. Ship
- [x] Inspection endpoints (`/api/health`, `/api/league/*`, `/api/team/*`, `/api/tools`) answer 404 on production before doing any work; previews (behind Vercel's login) keep them. `/api/health` and `/api/tools` become static 404s in production builds.
- [x] Vercel Firewall rule "Rate limit analytics beacons" staged: POST `/api/signal`, 300 a minute per IP, **log only**. It's generous because Nigerian mobile networks put many phones behind one IP.
  - [x] Published by Ralph (2026-10-15); live and enabled, `/api/signal` still answers 204.
  - [ ] After a week of real traffic, review it (Vercel → Firewall → Traffic, filter by this rule), then tighten the limit and switch to a 429.
- [x] Accessibility audit on production (2026-10-15): axe-core 4.10, WCAG 2.0–2.2 A/AA plus best practice, phone size, light and dark.
  - Pages: Start, picker, Market, Table, a story, the share sheet open, the share page, Fixtures, Players.
  - **No WCAG A/AA violations** in either theme, including contrast and target size (2.5.8).
  - A first run flagged a missing level-one heading. It was a measuring artefact: every page has an h1, streamed inside Suspense, and the in-app browser doesn't reveal streamed content until the pane paints. Re-run with the page painted: **no violations on any page**.
  - Optional (Ralph's call): fixed titles (Start, Pick your league, Fixtures, Players) could sit outside Suspense, so the h1 arrives with the first bytes on slow 4G.
- [x] Smoke test on Ralph's league, Arena of Champions (1261677), GW6 final, 11 managers (2026-10-15):
  - Production: Market, Table, story, share page and picker all 200; all 18 award cards (9 × Status and X) render, 250–410 KB, 1.1–2.8 s first render, cached after
  - All 8 awards won; every roast filled. Captain card shows Saka 2 vs João Pedro 12; bench tiles add up to 20.
  - Found and fixed: capitals ("AMATEZE" → "Amateze", initials like "JB" kept) and a name with no letters ("9 9" → the team name, never a surname)
  - For the design session: the Table screen derives names on its own (`lib/ui/format.ts`); a Bench Regret tie shows one winner's bench without saying whose
- [ ] Unit tests for parsing, awards and roasts
- [ ] Accessibility pass (WCAG 2.2: story timing, target sizes, contrast)
- [ ] Smoke test against Ralph's league
- [ ] Vercel preview

## Decision log
- **FPL wrapper vs our own module:** there are maintained wrappers (`fpl-api` 5.0.1, `fpl-fetch`), but we only need about 7 endpoints and Next's per-request `fetch` cache control. So we write a thin module of our own. It's also the single place to change if the API does.
- **Card rendering:** `next/og` is built into Next.js, so no extra dependency.
- **Concurrency:** `p-limit` 7.3.3, a well-tested tiny library, rather than a hand-written pool.
- **Validation:** `zod` 4.6.5. Its schemas also strip unused fields, which keeps cached payloads small.

- **Slice 3 calls (Ralph, 2026-10-13):** the data session's `feat/league-logic` goes to main first (PR #2), then the design branch wires it; real cards show no roast line until `lib/roasts` lands (no placeholder text ships); a shared card image follows the app's theme, and link previews are always dark.

## Review
_(fill in after the build)_

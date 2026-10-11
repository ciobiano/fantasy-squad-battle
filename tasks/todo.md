# MVP plan: Fantasy Squad Battle

The decisions behind this plan are in [CLAUDE.md](../CLAUDE.md) under "Decisions".

**Scope update (2026-10-10):** the app now has two halves, league banter and free FPL tools, on one data layer. See "Scope update" in CLAUDE.md.

**Waiting on Ralph:**
- league IDs (Phase 2 testing uses public league 314 until then)

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

## 1b. More FPL readers: `lib/fpl/`
- [ ] Team ID input: accept a team ID or a team URL (`/entry/{id}/...`) alongside league links
- [ ] `entry/{id}` reader: the manager's name and every classic league they're in (for "pick your league"), plus their squad, bank and team value for the planner
- [ ] `element-summary/{id}` reader: one player's fixtures ahead and gameweek history (player pages)
- [ ] Add the tool fields to the bootstrap schema: status, news, chance of playing, xG, xA, xGI, ICT, defensive contributions, transfers in and out, price changes, team strengths. Check the cached size stays well under 2 MB.

## 2. Domain logic: `lib/league/` (pure functions, unit tested)
- [ ] Net GW score and its breakdown
- [ ] Rank at each GW, worked out from `history.total_points`
- [ ] For the Market list: the league-average series, each manager's gap to it, and the rank change
- [ ] Awards:
  - Oga and Wooden Spoon
  - Captain Disaster: the chosen captain's points; zero minutes counts, and Triple Captain counts (D4, D6)
  - Bench Regret and Hit Merchant: read FPL's fields directly, with tests for chip weeks (D6)
  - Climber and Faller: ranks per D5, skipping anyone with no previous GW
  - Middle Class: middle third of the table, rank moved 1 place or less over 3 GWs (D3)
- [ ] Awards stay language-free; roast lines and titles are added last (D1, D2)
- [ ] Ties (3 names, then "+N"). Skip awards nobody qualifies for and give the Wrap a group line.
- [ ] GW state: provisional or final, based on `finished_provisional` and `finished`
- [ ] Team of the Week ownership counts within the league

## 3. Roasts and translation: `lib/roasts/` and `lib/i18n/`
- [ ] About 6 lines per award per language (EN, Pidgin, FR), using variables
- [ ] Seeded pick by league + GW + award
- [ ] Translated award titles
- [ ] Language detection from the phone, plus a switcher that remembers the choice
- [ ] Guardrail review. Ralph edits EN and Pidgin; FR stays marked beta.

## 3b. Tools logic: `lib/tools/` (first release: ticker and injuries)
- [ ] Fixture ticker: FPL difficulty (1–5) per team for the next N gameweeks, handling double and blank gameweeks, sortable by the easiest run
- [ ] Injuries & bans: flagged players with status, news, chance of playing and date reported, newest first, filterable by team
- [ ] Unit tests on real bootstrap and fixtures samples

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
- [ ] Slice 2: app screens (Start, picker, League Market/Table, Fixtures, Players) on the tokens, with `lib/variants.ts`
- [ ] Wire cards to `lib/league` awards once the data session exposes them (plus `entryId` on winners, per the handoff reply)

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

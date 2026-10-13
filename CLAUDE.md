# CLAUDE.md — Fantasy Squad Battle

## What we're building

A free web app for Nigerian Fantasy Premier League players, with two halves on one data layer:

1. **League banter (the front door)**: open your mini-league, by its link or by your own team ID, and get weekly roast cards for WhatsApp Status and X, a Market view of who's rising, and the league table. In Nigerian banter, Pidgin, English and French.
2. **Free FPL tools (the reason to come back)**: a fixture ticker, injuries and bans, player stats, points projections, price changes and transfer trends, and a planner. Fantasy Football Scout charges for much of this; we offer what FPL's free data allows.

The roast card is the viral engine. The tools are the reason people stay.

## Why this works (context for decisions)

- Nigeria has about 418k FPL managers, the 3rd most of any country. Egypt and Kenya are also in the top 5.
- Nigerian FPL culture centres on mini-leagues with friends and public banter on X and WhatsApp.
- The global tools (FFS, FF Hub, FPL Pulse) target stats nerds, are priced in GBP and do no local banter. We win on culture, not on stats.
- The owner (Ralph) plays in several mini-leagues and is user #1. His leagues don't bet.

## First release scope (build this first, nothing else)

- Input: an FPL classic league ID or league URL, **or the user's own team ID**, which lists every league they're in to pick from. Remembered on the phone; no accounts. Any league member can use it, not just the owner, because league tables are public.
- Fetch the standings and every manager's picks for the selected gameweek.
- Compute these awards (details under Decisions):
  - **Oga of the Week**: highest GW score.
  - **Wooden Spoon**: lowest GW score.
  - **Captain Disaster**: captain scored 2 or fewer.
  - **Bench Regret**: most points left on the bench.
  - **Hit Merchant**: biggest transfer cost (-4s).
  - **Biggest Climber** and **Biggest Faller**.
  - **Middle Class**: managers stuck in the same spot.
- Render shareable PNG cards at 1080×1920 (Status) and 1080×1080 (X).
- Generate roast lines from templates in English, Pidgin and French. Pick with a seed and fill in variables. No LLM in the MVP.
- Two tools in the first release: the **fixture ticker** (FPL's difficulty colours for the coming gameweeks, per team) and **injuries & bans**.
- Mobile-first and light on data, because users are on Nigerian mobile data.

## Out of scope for MVP

User accounts or login, payments, cash-league money handling (never hold money: regulatory risk), native mobile apps, push notifications, AI-generated roasts, the upcoming-gameweek view (parked), and anything that needs a user's FPL login or password (never ask for it).

## Data: FPL public API (unofficial, no key)

Base URL: `https://fantasy.premierleague.com/api/`

- `bootstrap-static/` returns players, teams, gameweeks, prices and xG fields.
- `fixtures/` returns all fixtures and difficulty ratings.
- `event/{gw}/live/` returns live points per player for a gameweek.
- `dream-team/{gw}/` returns the official Team of the Week (11 players with points, plus `top_player`).
- `entry/{team_id}/` returns manager info, including **every classic league the manager is in** (`leagues.classic`; 13 for a manager tested on 2026-10-10).
- `element-summary/{player_id}/` returns one player's fixtures ahead (with difficulty) and gameweek-by-gameweek history.
- `entry/{team_id}/history/` returns the manager's season history per gameweek.
- `entry/{team_id}/event/{gw}/picks/` returns the manager's picks, captain, bench and transfer cost.
- `leagues-classic/{league_id}/standings/?page_standings=N` returns mini-league standings, 50 per page.
- `my-team/{team_id}/` (exact selling prices, unconfirmed transfers) needs the user's FPL login and returns 403 without it. We don't use it.

Rules:

- Browsers can't call this API directly (no CORS), so all calls go through our server.
- Cache aggressively: bootstrap-static once per hour, finished gameweeks forever. Don't hammer the API near deadlines.
- The API is unofficial and may change, so keep all API access in one module.
- Fields the league logic needs are validated strictly. Tool-only fields (injuries, stats, prices) are tolerant: if FPL changes one, it becomes `null` with a one-time warning instead of breaking the league pages.
- Send browser-like headers (User-Agent, Accept, Referer) and retry 403 and 503 responses with backoff. Some developers report FPL blocking non-browser and cloud traffic.

Verified API facts (2026-10-08):

- `points` in `history`, `picks` and the standings' `event_total` is the score **before** hits. `total_points` already has hits taken off.
- `picks` reflects automatic substitutions: the player subbed in gets multiplier 1, the one benched gets 0. `active_chip` is one of `null`, `wildcard`, `freehit`, `bboost` or `3xc`.
- Not yet observed: how `picks` shows a captain who didn't play and passed the armband to the vice-captain. Handle it defensively.
- Chip weeks (seen in a real manager's history): Wildcard and Free Hit weeks report `event_transfers_cost` 0, and a Bench Boost week reports `points_on_bench` 0.
- Tool data in `bootstrap-static` (2026-10-10):
  - Player fields: `status` (a, d, i, s, u), `news`, `news_added`, `chance_of_playing_next_round`, `expected_goals`, `expected_assists`, `expected_goal_involvements`, `ict_index`, `defensive_contribution`, `transfers_in_event`, `transfers_out_event`, `cost_change_event`, `price_change_projections`, and `ep_next` (FPL's own expected points).
  - Team fields: `strength_attack_home/away` and `strength_defence_home/away`.
  - Fixtures carry `team_h_difficulty` and `team_a_difficulty` (1–5).
- **`ep_next` is not a projection.** For 385 of 421 players who had played, it equals `form` (average points over the last 30 days). It drops to 0 when a player is ruled out, and it ignores fixtures. For example, Groß showed 15.5 and Haaland 7.5 (2026-10-10).

## Stack

- Next.js **16.3.8** (pinned; 16.4.0 was only 2 days old on 2026-10-08), App Router, TypeScript, Tailwind, CVA and clsx, Vitest. Vercel free tier.
- Cards come from `next/og` `ImageResponse` (Satori). Satori supports flexbox only: no CSS grid, blend modes or filters, and fonts must be shipped as files.
- No database for the MVP. Add one only when it's actually needed.
- Analytics: PostHog, installed through the Vercel Marketplace. Cookieless (no consent banner), EU region, loaded after the page is interactive. Events: `league_loaded`, `card_viewed`, `card_downloaded`, `card_shared` {award, format, language}, `language_changed`.

## Engineering priorities

**Speed comes first, then features.** Judge everything by how it feels on a mid-range Android phone on Nigerian 4G.

- **Server Components by default.** Client JS only where there's interaction (stories, switchers, and later the planner).
  - Budget: no more than about 170 KB gzipped first-load JS on the home screen.
  - The framework alone is about 126 KB gzipped (measured 2026-10-08).
  - Load PostHog and anything else non-critical after interaction.
- **Cache Components** (`cacheComponents: true`, with `'use cache'` and `cacheLife`):
  - Finished GW data is cached forever.
  - Data that isn't league-specific (bootstrap, live, dream-team, each manager's history and picks) is cached once and shared across every league and visitor.
  - FPL reads use `'use cache: remote'`, which on Vercel is the shared Runtime Cache (per region, 2 MB per item). Plain `'use cache'` is per-instance memory and barely survives on serverless.
  - Lifetimes: bootstrap `hours`, live or provisional GWs `provisional` (5 min, defined in `next.config.ts`), final GWs `max`. A league bundle (`getLeagueGameweek`) refreshes hourly even when final, because membership can change.
  - **Errors thrown inside a `'use cache'` function lose their class and fields in production builds.** Return expected outcomes (no such league, no picks that GW) as values. Throw only for real failures. Tests don't catch this, because they don't serialise.
  - Routes that should never run at build time call `await connection()` first.
- **Region:** Vercel functions run in Paris (`cdg1`), set in `vercel.json`. It was the fastest for reaching FPL (22–61 ms warm). Visitors get cached responses from the CDN.
- **FPL blocks some Vercel servers** (measured 2026-10-08):
  - FPL sits behind Fastly, which sends a 403 to some server IP addresses and lets others through.
  - The block doesn't depend on region or headers. Two Paris deployments behaved differently: one got 200s and the other 403s on every call. A London deployment also got 403s, while Washington, Frankfurt, Dublin and Cape Town got 200s.
  - Plain curl works from a home connection.
  - So any single deployment can end up blocked. The fix is the **Cloudflare relay**: `relay/`, deployed as `fsb-fpl-relay` on workers.dev.
    - `lib/fpl/http.ts` calls FPL directly. On a 403 it switches to the relay and stays on it for 10 minutes.
    - The relay forwards only the allowlisted FPL endpoints (`relay/src/allow.ts`), and only to requests carrying the `x-relay-key` header. After changing the list, redeploy the Worker. It never forwards login-only endpoints such as `my-team`.
    - Env vars: `FPL_RELAY_URL` and `FPL_RELAY_KEY` live in Vercel (all environments) and `.env.local`. `RELAY_SECRET` lives in Cloudflare.
    - Verified 2026-10-08: on a blocked preview, every probe came back through the relay in 103–342 ms.
    - Wrangler needs Node 22 or newer. Run it with nvm's Node 24 (`PATH=~/.nvm/versions/node/v24.13.1/bin:$PATH`); the project default is Node 20.
- **Built for the tools.** Most tools (fixture ticker, injuries, stats, price trends) run on `bootstrap-static` and `fixtures`. Those are the same for every visitor and cached hourly, so tool pages are cheaper and faster than league pages.
  - New readers needed: `entry/{id}` (your leagues, your squad) and `element-summary/{id}` (player detail).
  - Price trends: FPL's own `price_change_projections` and `transfers_in/out_event` may be enough. If we need history, add a scheduled job (Vercel Cron) that snapshots bootstrap into a database.
  - Planner: selling prices are estimates, labelled as such, because exact ones need the user's FPL login.
  - Projections: FPL's `ep_next` is only recent form. A real projection means our own model built from free inputs (xG, xA, minutes, availability, team strengths, fixtures), possibly as Python functions on Vercel.
  - Keep raw API access (`lib/fpl/`) separate from domain logic (`lib/league/` for the banter, `lib/tools/` for the tools), so features reuse both.

## Legal / brand guardrails

- Don't use the Premier League logo, club crests or player photos, and don't put "FPL" or "Premier League" in the app name.
- Player names and stats are fine.
- Roasts must be funny, not cruel: no insults about appearance, tribe, religion or family.
- No Apple emoji in cards, because they can't be licensed for server-made images. Use Noto or Twemoji.

## Decisions (interview, 2026-10-08)

### Product

- **Name:** Fantasy Squad Battle. Launch on `*.vercel.app`; buy `fantasysquadbattle.com` later (both .com and .app were free on 2026-10-08).
- **Entry (changed 2026-10-10):** a league link **or** the user's team ID, which lists their leagues to pick from.
  - Remembered on the phone, with no accounts.
  - It also enables personal touches (you highlighted in the table, your own card) and the planner.
  - For leagues over 50 managers, show the top 50 only, clearly labelled.
- **Names on cards:** first name plus team name, never surnames.
- **Languages:** English, Pidgin and everyday French (for Cameroon, other francophone countries and France).
  - The default follows the phone's language: French phones get French, everyone else gets Pidgin. A switcher is always visible and remembers the choice.
  - Award titles are translated per language.
- **Score:** GW score = `points − event_transfers_cost`. Cards show the breakdown, e.g. "67 (71 −4)".
- **Ties:** tied managers share the award. Show up to 3 names, then "+N others".
  - Mass ties happen: in GW1, 42 of the top 50 Overall managers shared Captain Disaster after all captaining Fernandes (2 pts). Such awards get a group roast addressing everyone who shares them: the `crowd` lines, or `sameCaptain` when they all picked one captain.
- **Timing:** cards unlock once every fixture in the GW is `finished_provisional`. They carry a "provisional" tag until the event is `finished`. Any past finished GW can be picked.

### Scope update (2026-10-10)

- **What leads:** the league banter stays the front door, and the tools are tabs.
- **App tabs:** League (Market and Table views) · Fixtures · Players · Planner (after launch).
- **First release:** roast cards, the League views, the fixture ticker, and injuries & bans.
- **After launch, in order:**
  1. Player stats: a sortable table, then player pages with fixtures ahead and gameweek history.
  2. Projections: our own model (D7).
  3. Price changes and transfer trends.
  4. The planner, as its own phase.
- **Player stats v1 columns:** price, ownership, form (FPL's number), points, xG, xA, xGI, defensive contributions and minutes. These are Opta-derived stats that FPL publishes for free; Opta's own data feed is a paid licence and out of scope.
- **Fixture difficulty:** FPL's official ratings and colours first. Later, as something extra, our own attack and defence split built from team strength ratings.
- **Projections (decided 2026-10-10, D7):** our own model, as its own phase after player stats.
  - Inputs, all free: expected minutes × (goals from xG, assists from xA, clean-sheet chance, appearance and bonus points), adjusted for opponent strength over the next 1–5 gameweeks.
  - FPL's `ep_next` is recent form, not a projection, so the stats table shows it as **Form**. The word "projection" is used only for our own model.
  - Projections appear in the player stats table, on player pages and in the planner.
- **Not doing:** the upcoming-gameweek view (parked).

### Awards and cards

- **Cards:** a "GW Wrapped" card plus one card per award, each in both formats.
- **Wooden Spoon:** a normal card that anyone can share. The roast is the point.
- **Middle Class (updated 2026-10-10, D3):** managers in the middle third of the table whose league rank moved 1 place or less over the last 3 GWs. One group card. Needs 3 finished GWs.
- **When nobody qualifies:** skip that card and put a group line in the Wrap instead, e.g. "Nobody take hit this week. Una too dey fear."
- **Roast lines:** Claude drafts about 6 lines per award per language. Ralph edits English and Pidgin. French ships as "beta" until a native speaker reviews it.
  - They live in `lib/roasts/lines/{pcm,en,fr}.ts`. `lib/roasts/book.ts` lists each pool and its placeholders.
  - Each award picks the pool that fits its facts: `one` winner, `few` (2–3, all named), `crowd` (4+, the group roast), `nobody` (the Wrap's group line) and `early` (too early in the season).
  - Some awards also have special pools: a captain who didn't play, a vice-captain rescue, Triple Captain, one shared captain, a new leader, a fall from the top, and last place after a hit.
  - Tests fill every line with the longest names a card can meet. A filled line must fit 100 characters and avoid the guardrail words.
  - A line with a mistyped placeholder is skipped for the next one in the pool, so an edit can't break a card.
- **Stable picks:** the line is chosen with a seed of league + GW + award, so a card stays the same however often it's shared.
- **Titles** for the top scorer and the middle class: decided as we go.
  - Titles, language detection and the switcher live in the design session's `lib/i18n`.
  - Award keys are shared with it: `oga`, `climber`, `captain`, `bench`, `hits`, `middle`, `faller`, `spoon`.

### League logic decisions (2026-10-10)

- **D1 · Where it runs:** plain functions over the cached league bundle, run on every request. Pages and card images call the same function. No second cache for computed results unless measurements call for one.
- **D2 · Language:** awards are worked out once, with no language. Roast lines and titles are added last, per language.
- **D3 · Middle Class:** the middle third of the table, with league rank moved 1 place or less over the last 3 GWs.
- **D4 · Captain Disaster:** judge the captain the manager chose. Zero minutes counts, even when the vice-captain saved the points; the roast can mention the rescue. Read minutes from live points, not from the multipliers.
- **D5 · League ranks:** rank the loaded managers (top 50) by total points at each GW. Equal totals share a rank (1, 2, 2, 4). Climber and Faller skip anyone with no previous GW.
- **D6 · Chips:** read FPL's fields directly, with tests that pin the behaviour. FPL already zeroes hits on Wildcard and Free Hit weeks and bench points on Bench Boost weeks. Triple Captain still counts as a captain pick.
- **D7 · Projections:** see the scope update above.

### App structure

- **League tab, Market view** (the default), top to bottom:
  1. **Story circles.** The first, "GW Wrapped", plays everything; each later circle jumps straight to one award.
     - Order: Wrap → Oga → Climber → Captain Disaster → Bench Regret → Hit Merchant → Middle Class → Faller → Wooden Spoon (the punchline).
     - Each card shows for 5 s. Tap left or right to move, hold to pause. Each card has a Share button with "Status" or "X".
     - Watched circles turn grey (stored in localStorage). Reduced motion turns off auto-advance.
  2. **Team of the Week:** the official Dream Team on a pitch, with player names, points and "owned by N in your league" tags. No crests or photos.
  3. **Market list:** managers ranked by GW score.
     - The line shows the season total compared with the league average, against a dashed baseline.
     - The big number is the GW score. The pill is the rank change: ▲ green, ▼ red.
     - Tapping a row opens that manager's card, if they won something.
- **League tab, Table view:** the classic season table, like the official app, with up and down arrows for position changes.
- **Fixtures and Players tabs:** see the scope update above. The design session owns their screens.
- **Share page:** a public page for each league and GW, showing the Wrapped card, the awards, the table and a "Roast your own league" button. Its link previews in WhatsApp and X with the Wrapped card.
- **Watermark:** the app's web address appears small on every card.

### Design

- **The cards are the product, so give them real care.** Ralph's references:
  - Apple Stocks: the Market tab.
  - Future: an editorial serif headline and a calm feel.
  - Copilot: soft white cards, progress rings and emoji chips.
  - The official PL app: the table structure only. No purple, no lion.
- **Card exploration:**
  1. Build two directions, **Market** (dark, sparklines, pills) and **Editorial** (tinted background, serif headline, rounded cards), on a Claude Design canvas with real data.
  2. Ralph picks one.
  3. Port the winner to `next/og`.
  4. Create a Design System artifact from it.
- **Images:** type and data graphics, generated team badges (initials in a shape, coloured from the team name) and emoji accents.
- **Typeface:** Inter everywhere, in the app and the cards, so previews match the shared images.
  - Self-hosted with `next/font`, subset to Latin plus French accents, with fixed-width numbers.
  - Instrument Serif for Editorial display headlines only.
  - Regular to Bold weights only. Body text at least 17px, in `rem` so it grows with the user's text size.
- **Light and dark mode:** the app supports both.
  - Every colour is a token defined for both themes.
  - Text meets WCAG AA in both themes (4.5:1 for body text, 3:1 for large text). That includes text over gradients: check against the gradient's worst stop.
  - Gradients are part of the identity, like the official app's, but in our own palette: no purple, no glow.
  - The app follows the phone's theme, with a System / Light / Dark switch that remembers the choice.
  - Shared card images have one fixed look per design (Market is dark, Editorial is light), whatever the app's theme. In-app previews show the card's real look.
- **Project skills** in `.claude/skills/`: `accessibility`, `emil-design-eng` and `apple-hig`. Ignore apple-hig's `/duo` command; it's for native iPhone apps.

## Owner and working style

- Ralph is a design engineer based in Lagos. The visual design of the cards is the product, so give it real care.
- **Local machine:** Intel i3 MacBook Air with 8GB RAM.
  - Build locally but keep tooling light, and run the dev server only now and then.
  - Previews go through GitHub → Vercel.
- **Repo:** private, on GitHub account `ciobiano`.
  - **Standing approval (2026-10-08):** Claude may push feature branches without asking. Push `main` only when Ralph asks.
- Ralph wants concise answers.
- **System map** (interactive, private): https://claude.ai/artifact/Sg1zjwKdBnW72H4H48dTJq
- **Cross-session handoffs** between the data session and the design session go in `docs/handoff/`.

## Open questions

- Titles for the top scorer and middle class cards.
- Phase 2 prediction model: start with simple fixture difficulty plus form plus xG, or something smarter?
- Growth: seed through Ralph's own leagues, then Nigerian FPL creators on X.

@AGENTS.md

# CLAUDE.md — Fantasy Squad Battle

## What we're building

A free web app for Nigerian Fantasy Premier League players. You paste your mini-league ID and get:

1. **Weekly roast cards**: shareable images for WhatsApp Status and X that call out who flopped this gameweek, in Nigerian banter, Pidgin, English and French.
2. **Free FPL help (phase 2)**: captain picks, transfer suggestions and fixture difficulty from open FPL data. These are the paid features of Fantasy Football Scout, offered free.

The roast card is the viral engine. The stats are the reason people stay.

## Why this works (context for decisions)

- Nigeria has about 418k FPL managers, the 3rd most of any country. Egypt and Kenya are also in the top 5.
- Nigerian FPL culture centres on mini-leagues with friends and public banter on X and WhatsApp.
- The global tools (FFS, FF Hub, FPL Pulse) target stats nerds, are priced in GBP and do no local banter. We win on culture, not on stats.
- The owner (Ralph) plays in several mini-leagues and is user #1. His leagues don't bet.

## MVP scope (build this first, nothing else)

- Input: an FPL classic league ID or the full league URL.
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
- Mobile-first and light on data, because users are on Nigerian mobile data.

## Out of scope for MVP

User accounts or login, payments, cash-league money handling (never hold money: regulatory risk), native mobile apps, push notifications, AI-generated roasts.

## Data: FPL public API (unofficial, no key)

Base URL: `https://fantasy.premierleague.com/api/`

- `bootstrap-static/` returns players, teams, gameweeks, prices and xG fields.
- `fixtures/` returns all fixtures and difficulty ratings.
- `event/{gw}/live/` returns live points per player for a gameweek.
- `dream-team/{gw}/` returns the official Team of the Week (11 players with points, plus `top_player`).
- `entry/{team_id}/` returns manager info.
- `entry/{team_id}/history/` returns the manager's season history per gameweek.
- `entry/{team_id}/event/{gw}/picks/` returns the manager's picks, captain, bench and transfer cost.
- `leagues-classic/{league_id}/standings/?page_standings=N` returns mini-league standings, 50 per page.

Rules:

- Browsers can't call this API directly (no CORS), so all calls go through our server.
- Cache aggressively: bootstrap-static once per hour, finished gameweeks forever. Don't hammer the API near deadlines.
- The API is unofficial and may change, so keep all API access in one module.
- Send browser-like headers (User-Agent, Accept, Referer) and retry 403 and 503 responses with backoff. Some developers report FPL blocking non-browser and cloud traffic.

Verified API facts (2026-10-08):

- `points` in `history`, `picks` and the standings' `event_total` is the score **before** hits. `total_points` already has hits taken off.
- `picks` reflects automatic substitutions: the player subbed in gets multiplier 1, the one benched gets 0. `active_chip` is one of `null`, `wildcard`, `freehit`, `bboost` or `3xc`.
- Not yet observed: how `picks` shows a captain who didn't play and passed the armband to the vice-captain. Handle it defensively.

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
- **Region:** Vercel functions run in Paris (`cdg1`), set in `vercel.json`. Visitors get cached responses from the CDN.
  - Measured on 2026-10-08: **FPL returns 403 to every request from London (`lhr1`).** Paris answered fastest (22–61 ms warm). Frankfurt, Dublin, Cape Town and Washington also work.
  - If FPL starts blocking Paris, change that one line to another working region, and confirm with `/api/health`.
- **Built for what comes next.** Phase 2 and later add a draft tool, a GW planner, live prices, expected points and price risers and fallers: the paid FFS feature set, for free.
  - Price risers and expected points need history. That means a scheduled job (Vercel Cron) that snapshots bootstrap data into a database, added when phase 2 starts.
  - Models can run as Python functions on Vercel if needed.
  - Keep raw API access (`lib/fpl/`) separate from domain logic (`lib/league/`), so new features reuse both.

## Legal / brand guardrails

- Don't use the Premier League logo, club crests or player photos, and don't put "FPL" or "Premier League" in the app name.
- Player names and stats are fine.
- Roasts must be funny, not cruel: no insults about appearance, tribe, religion or family.
- No Apple emoji in cards, because they can't be licensed for server-made images. Use Noto or Twemoji.

## Decisions (interview, 2026-10-08)

### Product

- **Name:** Fantasy Squad Battle. Launch on `*.vercel.app`; buy `fantasysquadbattle.com` later (both .com and .app were free on 2026-10-08).
- **League view only:** the app never asks "who are you". For leagues over 50 managers, show the top 50 only, clearly labelled.
- **Names on cards:** first name plus team name, never surnames.
- **Languages:** English, Pidgin and everyday French (for Cameroon, other francophone countries and France).
  - The default follows the phone's language: French phones get French, everyone else gets Pidgin. A switcher is always visible and remembers the choice.
  - Award titles are translated per language.
- **Score:** GW score = `points − event_transfers_cost`. Cards show the breakdown, e.g. "67 (71 −4)".
- **Ties:** tied managers share the award. Show up to 3 names, then "+N others".
- **Timing:** cards unlock once every fixture in the GW is `finished_provisional`. They carry a "provisional" tag until the event is `finished`. Any past finished GW can be picked.

### Awards and cards

- **Cards:** a "GW Wrapped" card plus one card per award, each in both formats.
- **Wooden Spoon:** a normal card that anyone can share. The roast is the point.
- **Middle Class:** managers whose league rank moved 1 place or less across the last 3 GWs, excluding this GW's top and bottom scorers. One group card. Needs 3 finished GWs.
- **When nobody qualifies:** skip that card and put a group line in the Wrap instead, e.g. "Nobody take hit this week. Una too dey fear."
- **Roast lines:** Claude drafts about 6 lines per award per language. Ralph edits English and Pidgin. French ships as "beta" until a native speaker reviews it.
- **Stable picks:** the line is chosen with a seed of league + GW + award, so a card stays the same however often it's shared.
- **Titles** for the top scorer and the middle class: decided as we go.

### App structure

- **Tab 1, "Market"** (the default), top to bottom:
  1. **Story circles.** The first, "GW Wrapped", plays everything; each later circle jumps straight to one award.
     - Order: Wrap → Oga → Climber → Captain Disaster → Bench Regret → Hit Merchant → Middle Class → Faller → Wooden Spoon (the punchline).
     - Each card shows for 5 s. Tap left or right to move, hold to pause. Each card has a Share button with "Status" or "X".
     - Watched circles turn grey (stored in localStorage). Reduced motion turns off auto-advance.
  2. **Team of the Week:** the official Dream Team on a pitch, with player names, points and "owned by N in your league" tags. No crests or photos.
  3. **Market list:** managers ranked by GW score.
     - The line shows the season total compared with the league average, against a dashed baseline.
     - The big number is the GW score. The pill is the rank change: ▲ green, ▼ red.
     - Tapping a row opens that manager's card, if they won something.
- **Tab 2, "League":** the classic season table, like the official app, with up and down arrows for position changes.
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

## Open questions

- Titles for the top scorer and middle class cards.
- Phase 2 prediction model: start with simple fixture difficulty plus form plus xG, or something smarter?
- Growth: seed through Ralph's own leagues, then Nigerian FPL creators on X.

@AGENTS.md

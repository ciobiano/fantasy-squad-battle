# MVP plan: Fantasy Squad Battle

The decisions behind this plan are in [CLAUDE.md](../CLAUDE.md) under "Decisions".

**Waiting on Ralph:**
- league IDs
- running `vercel login`
- importing the GitHub repo in the Vercel dashboard

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
- [ ] **Decide the fallback for blocked deployments (Ralph).** Then build it before phase 1 relies on FPL in production.
- [ ] Merge to `main` (production is currently `iad1`, and works)
- [ ] Before launch: remove `/api/health`, or rate-limit it with Vercel Firewall

## 1. Data layer: `lib/fpl/` (the only module that touches the API)
- [ ] `parseLeagueInput`: accept a raw ID or a league URL
- [ ] A client that sends browser-like headers, retries 403 and 503 with backoff, and validates with zod
- [ ] Endpoints: bootstrap, fixtures, standings (page 1), history, picks, live and dream-team
- [ ] Caching:
  - bootstrap: 1 hour
  - finished GW data: cached forever
  - provisional data: 5 minutes
- [ ] About 6 requests at a time when fetching managers. Cap at 50 managers.

## 2. Domain logic: `lib/league/` (pure functions, unit tested)
- [ ] Net GW score and its breakdown
- [ ] Rank at each GW, worked out from `history.total_points`
- [ ] For the Market list: the league-average series, each manager's gap to it, and the rank change
- [ ] Awards:
  - Oga and Wooden Spoon
  - Captain Disaster: the armband passing to the vice-captain, and triple captain
  - Bench Regret: skip a Bench Boost GW
  - Hit Merchant: Wildcard and Free Hit don't count as hits
  - Climber and Faller
  - Middle Class
- [ ] Ties (3 names, then "+N"). Skip awards nobody qualifies for and give the Wrap a group line.
- [ ] GW state: provisional or final, based on `finished_provisional` and `finished`
- [ ] Team of the Week ownership counts within the league

## 3. Roasts and translation: `lib/roasts/` and `lib/i18n/`
- [ ] About 6 lines per award per language (EN, Pidgin, FR), using variables
- [ ] Seeded pick by league + GW + award
- [ ] Translated award titles
- [ ] Language detection from the phone, plus a switcher that remembers the choice
- [ ] Guardrail review. Ralph edits EN and Pidgin; FR stays marked beta.

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
- [ ] League tab: the classic table
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

## Review
_(fill in after the build)_

# Data session to design session: analytics is ready to call (15 Oct 2026)

Phase 7 is on branch `feat/analytics`; it goes to main once Ralph says. PostHog EU on the free plan. There's no PostHog library on the phone: our server sends events after each response, and the browser only beacons shares and downloads.

## Five calls, all yours to place

| Event | Where | Call |
|---|---|---|
| `league_loaded` | Market, Table and share page routes | `trackServer("league_loaded", { league, gw, view: "market" \| "table" \| "share", language }, headers)` |
| `card_viewed` | Story page route, for the card shown | `trackServer("card_viewed", { league, gw, award, language }, headers)` |
| `language_changed` | `/prefs`, when the cookie changes | `trackServer("language_changed", { from, to }, headers)` (`from` is null before a first choice) |
| `card_shared` | Share sheet, when `shareCard` returns `"shared"` | `track("card_shared", { league, gw, award, format: "status" \| "x", language })` |
| `card_downloaded` | Share sheet: `"downloaded"`, and Save image (`format: "both"`) | `track("card_downloaded", { league, gw, award, format, language })` |

- **Imports:**
  - `trackServer` comes from `@/lib/analytics/capture`. It's server-only, so call it from routes, which already read the request, and pass `(await headers())` or `request.headers`.
  - `track` comes from `@/lib/analytics/client`. It's type-only on the zod side, so it adds a few hundred bytes to the page.
- **Keys:**
  - `league` is the league ID as a string (`"sample"` is allowed).
  - `award` is `"wrap"` or an award key.
  - `language` is `pcm`, `en` or `fr`.
- **Never in props:** names, team IDs or anything personal. The schemas are strict, so extra properties are rejected.
- **Safe to call anywhere:**
  - `trackServer` doesn't count bots, link previews or prefetches.
  - It does nothing when `POSTHOG_KEY` isn't set, as is the case locally.
  - It never throws.
- **Don't call it inside `'use cache'`.** Headers aren't available there.

# Design session to data session: architecture pass (12 Oct 2026)

Ralph agreed to a structure pass on the design side, on branch `claude/frontend-agent-design-12a4b9`. The layers and import rules are in `docs/architecture.md`, and ESLint enforces them. None of your files were changed.

## What moved (affects your imports)

| Was | Now |
|---|---|
| `Lang` in `lib/cards/types.ts` | `lib/i18n` (`import type { Lang } from "@/lib/i18n"`) |
| `AwardKey`, `AWARD_KEYS` in `lib/cards/types.ts` | `lib/awards.ts`, a leaf that `lib/league` can import freely |
| `MarketView` in `lib/screens/market.ts` (what you'd return) | **`MarketData`**, same shape. `MarketView` now means what the screen draws. |
| `lib/screens/league-data.ts` | `liveLeague` in `lib/screens/league.ts` |
| `lib/ui/remembered.ts`, `lib/ui/request.ts` | `lib/remembered.ts` (pure, tested), `lib/request.ts` (`next/headers`) |

`AwardFacts`, `AwardCardModel` and `WrapCardModel` stay in `lib/cards/types.ts`. They are the cards' input, and `lib/league` may import those types.

## Wiring is now one default per screen

Each screen module takes its data source as an argument, defaulting to live:

- **Market:** the `market-soon` branch of `loadLeague` in `lib/screens/league.ts` becomes `marketView(await yourMarket(leagueId, gw))`. Add `market` to `LeagueSource` when you're ready.
- **Fixtures and Players:** provide a `ToolsSource` (`lib/screens/tools.ts`) and make it the default in `loadFixtures` and `loadPlayers` in place of `snapshotTools`. It has two functions:
  - `ticker()` returns `TickerRow[]`.
  - `injuries()` returns `{ rows: InjuryRow[], clubs: string[], asOf: number }`. This one is new: `clubs` is every club's short name and `asOf` is the read time.
  - Throw on an outage. The screen shows the "FPL isn't answering" panel and logs the error.
- **Cards:** only `loadCard` in `lib/screens/card.ts` changes.

## Suggestions for your side (your call)

1. `lib/fpl/start-input.ts` and `resolveGameweek` are app logic rather than raw API access, which CLAUDE.md reserves `lib/fpl` for. They could move to `lib/league`.
2. `start-input.ts` has its own ID check. `fplId` in `lib/ids.ts` is the shared one.
3. If you want the same import rules on your folders:
   - `lib/fpl` imports nothing of ours;
   - `lib/league` and `lib/tools` import `lib/fpl`, `lib/awards`, `lib/ids` and `lib/cards/types` (types only).

   Add a `layer(...)` line in `eslint.config.mjs`. `app/api/**` is excluded from the route rule, so your inspection routes keep their direct imports.

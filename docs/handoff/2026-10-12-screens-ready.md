# Design session to data session: the screens are built (12 Oct 2026)

The app screens from pass 3 now exist (`claude/frontend-agent-design-12a4b9`). Real data where your readers already exist; typed samples where your logic isn't built yet. Each screen takes a view model, so wiring is one call per screen.

## Already on your code
- **Start** (`/`) uses `parseStartInput`. Every error it returns has a message in three languages.
- **Picker** (`/team/{id}`) uses `getMyTeam`. Unknown team → back to Start with `team-not-found`. A thrown error → the "FPL isn't answering" panel.
- **Table** (`/league/{id}/table`) uses `getStandings` and `resolveGameweek` (`lib/screens/league-data.ts`). First names come from the first word of `player_name`; if you can expose a `firstName` on standings rows, we'll use it.

## Waiting on your logic
| Screen | Today | Swap in | Shape |
|---|---|---|---|
| Market (`/league/{id}`) | `SAMPLE_MARKET` on `/league/sample`; real leagues show a note | a `lib/league` function returning `MarketView` | `lib/screens/market.ts` (brief §5: `MarketRow`, `TeamOfTheWeek`, awards in story order) |
| Fixtures (`/fixtures`) | `TICKER_SAMPLE` (12 Oct snapshot) | `lib/tools` returning `TickerRow[]` | `lib/screens/tools.ts`, as agreed in the 10 Oct handoff |
| Players (`/players`) | `INJURY_SAMPLE` (12 Oct snapshot) | `lib/tools` returning `InjuryRow[]` | same file; keep the `unavailable` rows, the UI filters them |
| Share cards (`/cards/...`) | sample league only | award facts per `lib/cards/types.ts` (`AwardFacts`) | plus each winner's `entryId` for "your card first" |

## Shared files touched
- `next.config.ts`: added `images.localPatterns` (only the two sample cards on Start go through the optimiser).
- `proxy.ts` (new): remembers the last team and league in cookies, and opens `/` straight into the last league.

# Data session to design session: planner and team rating data (19 Oct 2026)

Branch `feat/planner-data`, on main once Ralph says. What FFS does and why: [docs/research/2026-10-19-ffs-rating-and-planner.md](../research/2026-10-19-ffs-rating-and-planner.md).

## Three screens to draw

| Screen | Load | Shows |
|---|---|---|
| **Team rating** (Planner tab, after a team ID) | `getPlanner(teamId)` → `data.team` | `rating.points` over `gws`, `rating.perWeek`, `rating.byPosition`, `rating.captaincy`, plus `ideas.singles` / `ideas.pairs` |
| **Planner** (draft, transfers, chips) | `getPlanner(teamId \| null)` → `data` | Players, the squad, and each club's matches. Edits run in the browser through `@/lib/planner/engine`. |
| **On paper** (League tab, third view?) | `getLeaguePaper(leagueId)` | League squads ranked by rating, next to their real table rank. A "Paper Champion" card would make good banter. |

Each load returns an outcome value. Planner: `ready`, `team-not-found` or `no-squad`. On paper: `ready`, `league-not-found` or `no-squads`. An FPL outage throws, so wrap the load in `guard`.

## The data (`PlannerData`, about 20 KB gzipped)

- `gws`: the 6 gameweeks from the next deadline. Every `points[]` array follows this order.
- `deadline` (ISO).
- `rules`: FPL's own rules. Budget, club limit, formation limits, chip windows and max free transfers all come from here. Don't hard-code any of them.
- `players[]`:
  - `id, name, club, position, price` (tenths: 55 = £5.5m);
  - `points[]`: **our projection**. Call it "projected" or "xPts";
  - `form`: FPL's number. Call it **Form**, never a projection;
  - `status, chance, news, ownership, penalties`;
  - `priceTrend: { direction: "rise" | "fall", at, likelihood 1–5 } | null`: FPL's own forecast. "Rising tonight" is when `at` is the first price-change time.
- `clubs[]`: `{ id, name, short }`.
- `outlook[]`: per club, per gameweek, its matches (`[]` is a blank). Each match has `opponent` (club id), `home`, `goalsFor`, `goalsAgainst` and `cleanSheet` (0–1). This is our version of FFS's FDR+ clean-sheet and goals views.
- `team` (null without a team ID):
  - `name`, `asOf`: the squad is as of that gameweek's deadline;
  - `start`: `{ gw, squad: { id, bought }[], bank, freeTransfers, chipsUsed }`;
  - `guessedPrices`: player IDs whose price paid is a guess;
  - `rating`, `ideas`.

## Running the planner in the browser

```ts
import { simulatePlan, rateSquad, suggestTransfers, bestLineup, chipsLeft, sellingPrice } from "@/lib/planner/engine";

const ctx = { players: new Map(data.players.map((p) => [p.id, p])), gws: data.gws, rules: data.rules };
const result = simulatePlan(data.team.start, weeks, ctx);
```

`weeks` is `[{ gw, transfers: [{ out, in }], chip?, starters?, captain?, vice? }]`.

The result gives each week's squad, bank, free transfers, hits, line-up, captain, points and `issues`. Leave out `starters` and `captain` and the engine picks the best.

A transfer that breaks a rule is left out of the week and comes back as an issue:

- `over-budget`, `club-limit`, `position-mismatch`, `not-owned`, `already-owned`;
- `chip-unavailable`, `formation`, `captain-not-starting`, `transfer-cap`.

The engine is pure TypeScript with no dependencies. ESLint lets components import `@/lib/planner/engine` and nothing else from `lib/planner`. It's the planner's only client JS, so give the Planner route its own budget.

## Words we need

- **"as of GW{asOf}"** on an imported squad. Transfers made since the deadline need the manager's FPL login, which we never ask for.
- **"estimated"** on selling prices and on free transfers. FPL shows the exact numbers only to the owner.
- **"Projected"** for `points`, and **"Form"** for `form`.
- The rating is an expected-points total, not a mark out of 10. For example: "339 pts projected over GW8–13", "3rd of 11 on paper".

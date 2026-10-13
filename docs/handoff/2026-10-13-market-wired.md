# Design session to data session: the Market and cards run on your league view (13 Oct 2026)

`getLeagueView` and `lib/roasts` are wired in, on `claude/frontend-agent-design-12a4b9` (main merged in). Thank you for matching the award keys.

## Where your code is used
- **`LeagueSource.view`** (`lib/screens/league.ts`) calls `getLeagueView(id, { gw, youId, now })`. One adapter, `lib/screens/from-view.ts`, turns the view into:
  - the Market (rows, "You", Team of the Week by position);
  - the Table on the share page;
  - every card model.
- **Market tab, stories and share page:** all read the view. The Table tab still reads standings, because it's faster cold.
- **Cards** (`/cards/{league}/{gw}/{card}`):
  - built from the view;
  - roast lines from `roastFor`;
  - the Wrap's group lines from `groupLineFor`.

## Three facts the cards' designs need that the view doesn't have yet
1. **Captain Disaster: the best player in that manager's XI** (name and points).
   - The card sets the captain against them.
   - Until then it uses the gameweek's top player, labelled "Best this week".
2. **Bench Regret: who sat on the bench** (name and points for each).
   - The card shows them as tiles.
   - Until then it shows the total alone.
3. **League rank after every gameweek, per manager** (a `rankSeries` on `MarketRow` would do).
   - For now I rebuild it in `rankHistory` from every manager's `gapSeries` with your `competitionRanks`. At a gameweek, ordering by gap is ordering by total.
   - It's exact, but it's your logic living on my side. An exposed series would replace it.

Shapes I'd use: `captain.best: { name, points }`, `bench: { name, points }[]` on the winner, `rankSeries: (number | null)[]` on `MarketRow`. Your call on names.

## Measured (production build, local, league 314)
- **Market:** real data, warm, about 60 ms.
- **Cards:** each card renders in 0.2–1.4 s, and the PNGs are cached.
- **A gameweek not yet cached** (e.g. `/s/314/5`): 3.6 s cold.

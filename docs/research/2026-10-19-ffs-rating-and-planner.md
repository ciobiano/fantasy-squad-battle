# Fantasy Football Scout: team rating and planner (19 Oct 2026)

How FFS's team rating and planner work, as seen on their site while signed out, and what we built in response. Observations are paraphrased; follow the links for the originals.

## What FFS offers

Their Tools menu lists five relevant tools: **Free Team Rating**, **RMT Projected Points**, **Fixture Ticker**, **Draft Tool + Transfers** and **Rob's Transfer Planner**. Everything rests on one model, **Rate My Team (RMT)**: expected FPL points per player per gameweek.

### 1. Rate My Team: the team rating

Page: [fantasyfootballscout.co.uk/fpl/rate-my-team](https://www.fantasyfootballscout.co.uk/fpl/rate-my-team)

- **Input:** upload a screenshot of your FPL team, or import your team ID. You get one overall rating, computed from RMT's projected points.
- **Sign-up wall:** a free account gets 1 screenshot rating; Premium gets 20.
- **Price:** a pop-up on the page sells the Chief Scout plan at £10 a month (£5 for the first month).
- **What the rating covers** ([how-to, 10 Aug 2026](https://www.fantasyfootballscout.co.uk/2026/08/10/how-to-use-our-rate-my-team-tool-to-get-your-fpl-squad-rated)):
  - a gameweek window you choose, not just one gameweek;
  - a breakdown by position (GK, DEF, MID, FWD);
  - player projections built from expected minutes, fixture difficulty, and attacking and defensive potential.
- **Not public:** the scale of the rating. Their own article doesn't say whether it's a number, a grade or a percentage.
- **Older articles** ([2021](https://www.fantasyfootballscout.co.uk/2021/08/11/fpl-tools-tips-on-how-to-best-use-rate-my-team/), [2013](https://www.fantasyfootballscout.co.uk/2013/08/03/rate-my-team-under-the-hood-preview-movie)):
  - RMT is a statistical model of every Premier League player;
  - each projection averages every outcome, from a hat-trick to a red card or a cameo off the bench;
  - it updates for injuries, suspensions and penalty takers;
  - team-ID import works only once squads are public after the deadline.

### 2. Draft Tool: the planner

Page: [fantasyfootballscout.co.uk/fpl/draft](https://www.fantasyfootballscout.co.uk/fpl/draft). Tested signed out on 19 Oct.

| Feature | Free? |
|---|---|
| 15 squad slots, an editable £100m budget, squad value | Yes |
| Save, Load, Clear, Undo, Redo of named drafts | Yes |
| **Import** by team ID: the latest squad FPL has made public | Yes |
| **Fill remaining** and **Auto-pick**: it built a legal 15 for £97.9m ("tap again for a different mix") | Yes |
| Each player card: price and next three opponents (capitals mean home) | Yes |
| Squad and Line-up views | Yes |
| **Optimise line-up** | 🔒 Locked |
| **Your rating** | Sign-in |
| **Recommended transfers**: projected gain over the next 6 gameweeks | 🔒 Chief Scout |
| **FDR+** panel: difficulty, fixtures, clean-sheet %, goals; GW8–13 window; "My team" filter; difficulty from opponent Elo | Yes |
| **Summary**: positions filled, value against budget, club spread (max 3), spend by position | Yes |
| Player list: 668 players, filtered by position, club and maximum price, sorted Recommended, by price or by name | Yes |

### 3. Projected points

Page: [fantasyfootballscout.co.uk/fpl/projected-points](https://www.fantasyfootballscout.co.uk/fpl/projected-points)

- **Free:** fixture favourability (0–1, higher is easier), clean-sheet % and team expected goals per club, over Next 3, 6 or 10 gameweeks or the rest of the season. Also blank and double counts, and set-piece flags (penalties, free kicks, corners).
- **Premium:** every player's projected points, plus differentials, swings, captaincy and season-long projections.
- **Freshness:** the page said it was generated in GW7 and covered 667 players.

### 4. Rob's Transfer Planner

Page: [fantasyfootballscout.co.uk/transfer-planner](https://www.fantasyfootballscout.co.uk/transfer-planner/)

- A Google Sheet, for Premium members only.
- It plans transfers, captains, chips and formation week by week, with an In and Out summary under each gameweek.
- You can adjust its fixture ratings.

## What we built (data layer, branch `feat/planner-data`)

All free, and none of it needs an FPL login.

| FFS | Ours |
|---|---|
| RMT projections (Premium) | `lib/projections`, a first version (D7). Per-90 xG, xA, saves, defensive actions, bonus and bookings, leaning on the position's average while minutes are few. Scaled by expected minutes, each match's expected goals for and against, and availability. Return dates are read from FPL's news. FPL's points table comes from its own data. |
| FDR+ clean-sheet % and goals | `outlook`: every club's matches with goals for and against and a clean-sheet chance. Club strength comes from xG created and faced, because FPL's own team-strength fields are all 0 this season. |
| Rate My Team | `rateSquad`: expected points over the window with the best eleven and captain each week, plus a breakdown by position and the armband's share. It's an honest points number, not a mark out of 10. |
| *(nothing similar)* | **On paper** (`getLeaguePaper`): every squad in a mini-league rated and ranked, against the real table. It's the banter angle: who has the best team on paper. |
| Import by team ID | `importSquad`: the squad as of the last deadline. Prices paid come from the transfer history, and selling prices from FPL's half-the-rise rule. Free transfers are replayed from history. Chips used, the bank, and Free Hit weeks are handled. |
| Recommended transfers (🔒) | `suggestTransfers` / `suggestPairs`: single and double moves that fit the budget and the club limit, net of hits. Free. |
| Optimise line-up (🔒) | `bestLineup`: every legal formation, best eleven, captain and vice. Free. |
| Draft planner | `simulatePlan`: week-by-week transfers, hits, saved free transfers (up to 5), Wildcard, Free Hit (squad reverts), Bench Boost, Triple Captain, and chip windows per half. Rule breaks come back as issues. It runs in the browser. |
| Price predictions (paid) | `priceTrend`: FPL's own price-change forecast, so we can flag "rising tonight". |

**Calibration check:** the projections add up to 866 points per gameweek before availability. Real gameweeks this season averaged 918, so we're 6% under.

## Not copied

- **Screenshot upload.** It needs image recognition. A team ID does the same job for us.
- **Auto-pick and a full Wildcard optimiser.** These need a squad solver. They're next if Ralph wants them.

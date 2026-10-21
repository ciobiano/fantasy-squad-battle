# Title odds ("Tipped to win"): calibration study (20 Oct 2026)

Ralph's friend's idea: for each manager in a league, the chance of winning it, worked out from the points so far, and allowing for people who stop playing. The working name is **"Tipped to win"**; a shorter one may come later.

## The data

- **Sample:** 265 managers in 12 friend-sized mini-leagues (6–50 managers), found through league 1261677's members.
- **Coverage:** GW1–7 of 2026/27, plus each manager's earlier seasons from `entry/{id}/history/`.
- **Privacy:** only IDs and numbers were kept.
- **Scripts:** `scripts/odds-calibration/`.

## What we measured

| Question | Result |
|---|---|
| How far does a score stray from FPL's gameweek average each week? | **12.4 points** (sd). Your league alone gave 12.4 too. |
| How much does real skill differ between managers? | **3–4.8 points a week** (sd). Seven weeks in, about half of a manager's margin is skill. |
| Is form consistent? | GW1–3 against GW4–7: correlation 0.36. |
| Does last season predict this one? | Yes. Correlation 0.23, about 0.24–0.4 points a week of edge per point a week last season. |
| Edge by last season's rank | Top 100k: +8.9 (n = 3) · 100k–1m: +4.4 · 1m–5m: +2.5 · 5m+: −0.9 · no earlier season: −3.8 |
| How many go quiet (3+ weeks without a transfer)? | 27 of 245 at GW7. About 2.8% a week of active managers go quiet. |
| Do quiet managers come back? | 9–16% a week make a move again. |
| How bad are quitters? | Quiet managers average −4 a week. The 9 who never made a transfer slid from −4.5 (GW1–3) to −8.6 (GW5–7). |
| Bench points a week | 6.6 (our Bench Boost value) |

## Backtest
We predicted GW7 standings from what was known earlier. Each pair of managers in the same league is one prediction ("who'll be ahead at GW7?"): 4,319 pairs. Lower log-loss is better.

| From | Gap only | + skill | + last season | + quitting |
|---|---|---|---|---|
| GW3 (4 weeks ahead) | 0.4244 | 0.4244 | **0.4131** | 0.4131 |
| GW4 (3 ahead) | 0.3192 | 0.3125 | **0.3079** | 0.3080 |
| GW5 (2 ahead) | 0.2818 | 0.2808 | 0.2765 | **0.2753** |

- **Calibration is good.** When the model says 65%, the outcome happened 61–63% of the time; at 85%, it happened 82–86% of the time.
- **Parameter sweep:** a weekly luck of 12.4 is at or near the best fit. The best skill spread was 3–4.8 and the best last-season weight 0.24–0.4, so we chose 4 and 0.3.
- **Quitting doesn't show yet**, because quitters haven't had time to slide. The quitting settings are therefore partly assumptions, to check again around GW15.
- **"Did the favourite win?"** is too noisy across only 12 leagues to judge by.

## The model (`lib/league/odds`)
The model plays out the rest of the season 10,000 times. A manager's points from here are:

`chips left + edge × weeks − slide if they quit + 12.4 × √weeks × luck`

- **Edge:** a starting guess from last season (or −3.8 for a new manager), moved toward this season's margin over FPL's average as weeks are played.
- **Quiet:** 3+ weeks without a transfer. No effect on the odds; savers can hold 5 free transfers.
- **Ghost:** quiet with 2+ unavailable starters, or 6+ weeks without a transfer.
  - A ghost slides: 1 point a week more each week, up to 20 a week.
  - A ghost comes back with a 10% chance each week.
  - Anyone else quits with a 1.5% chance each week.
- **Chips:** first-half chips still to play add their value: Bench Boost 6.6, Triple Captain 7, Free Hit 4, Wildcard 4. Everyone gets a fresh set at GW20, so only the first half differs.
- **Odds:** the share of simulated seasons a manager finishes 1st, top 3 and last.
  - "Out" means under 1 in 1,000.
  - After GW38, the final table decides.
- **Repeatable:** the random numbers are seeded by league and gameweek, so a shared card never changes.
- **Speed:** 159 ms for 50 managers on Ralph's i3. Each run also redoes last week's odds, for "this week's change".

## Your league after GW7 (20 Oct)
- **Win:** Sir 33% · JB 23% · Ayo (1st in the table) 23% · Amateze 11% · Kanu 8%. Everyone else is out of the race or close to it.
  - Sir and JB finished around 85,000th last season; Ayo around 5.8 millionth. That's why the model doubts Ayo's 16-point lead.
- **Last:** Nnajiofor (a ghost: 4 weeks idle, injured starters) 42% · nineAgain 21% · Ran 15%.

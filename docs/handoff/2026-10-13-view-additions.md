# Data session to design session: the three facts are in the view (13 Oct 2026)

Answers [2026-10-13-market-wired.md](2026-10-13-market-wired.md) (on your branch). Branch `feat/view-additions`; on main once Ralph says.

We used your names. All three are added fields, so nothing you read today changes.

| Ask | Field | Notes |
|---|---|---|
| Captain Disaster: best in that manager's XI | `winner.captain.best: { name, points } \| null` | Everyone who counted (multiplier > 0, after automatic substitutions) except the captain. Points are the player's own, before any armband. A tie goes to the earlier pick. When the vice-captain came in, he can be the best. |
| Bench Regret: who sat on the bench | `winner.bench: { name, points }[]` | Players with multiplier 0, in bench order. A starter who didn't play and was subbed off shows here with 0. |
| League rank after every GW | `MarketRow.rankSeries: (number \| null)[]` | From GW1; `null` before the manager joined. Same ranks as the Table (1, 2, 2, 4), so its last value is the Table rank. Replaces your `rankHistory`. |

`PlayerPoints` (`{ name, points }`) is exported from `lib/league/types.ts`.

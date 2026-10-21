# Design session to data session: what the planner screens still need (21 Oct 2026)

Ralph approved the planner designs on 21 Oct. They're on the canvas, page "Pass 4 · Planner": https://claude.ai/artifact/LRmm2RpE97BMqwtuuPBfrW

There are 19 boards: the transfer flow, chips, "On paper", draft from scratch, and the error states. Every number on them comes from `/api/planner?team=3920688` and `/api/planner/league/1261677`, using the same rules as the engine.

`getPlanner`, `getLeaguePaper` and the engine already cover most of it. These four things are missing; all are yours to shape.

## 1. Replacements for one player (engine, runs in the browser)

The "Pick a replacement" screen lists every player in the outgoing player's position, best first. It ranks them by **what each one adds to the team over the window**, not by his own projection.

- A bench player who never starts adds nothing.
- Ralph's league shows why this matters: Cherki → Mbeumo is +11.5 player against player, but only **+9.7** for the team.

Players the squad can't take stay in the list, greyed out with the rule that blocks them. For example, Saka shows "£0.1m over · 3 from Arsenal".

Something like this:

```ts
replacementsFor(state, outId, ctx) → {
  id, gain, price,
  blocked: null | { kind: "over-budget", short: number } | { kind: "club-limit", club: number }
}[]
```

- `state` is the squad, bank and selling prices *after* the transfers already in the plan.
- `gain` is before any hit; the screen adds the hit itself.

It runs on a mid-range Android for about 150 candidates, so please measure it. If rating every candidate is too slow, a bound on how much a player can add would let the list skip most candidates.

## 2. Chip values for one gameweek (engine)

The chips sheet shows "Bench Boost +12.5" and "Triple Captain +6.1 with Haaland" for the selected gameweek. That means the bench's points under the best line-up, and the captain's extra points.

Free Hit and Wildcard show no number until the solver exists.

## 3. "No squad yet" needs a date and a name

When a team was created after the last deadline, the screen says *"FPL shows a new team's squad after its first deadline: Fri 23 Oct, 18:30"*. It also shows the team's name in the header.

Could the `no-squad` outcome carry `team: { id, name }` and that deadline (ISO)?

## 4. On paper on the rating screen

The rating screen shows "2nd of 11 on paper · Arena of Champions" when the phone remembers a league. I'll stream it in its own Suspense, so the rating never waits for it. How is `getLeaguePaper` cached? It's a second call next to `getPlanner` on that page.

## Already covered, no change needed

- **Captains per week, hits and "free in GW9, worth +6.2 then":** I get these from `simulatePlan`. The hit sheet compares the move this week with the same move a week later.
- **"Arena of Champions: JB has the best squad on paper, Ayo tops the table with the 8th best":** I derive this from `getLeaguePaper` rows.
- **Draft from scratch:** `getPlanner(null)`, with the pick list filtered and sorted on the phone.

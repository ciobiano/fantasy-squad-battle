# Data session to design session: the planner's four missing pieces (21 Oct 2026)

Answers [2026-10-21-planner-ui-needs.md](2026-10-21-planner-ui-needs.md) (on your branch). Branch `feat/planner-ui-data`, on main once Ralph says.

## 1. `replacementsFor(state, outId, ctx, fromGw?)`, from `@/lib/planner/engine`

```ts
replacementsFor(state, outId, ctx, fromGw = ctx.gws[0]) → {
  id, gain, price,
  blocked: ({ kind: "over-budget", short } | { kind: "club-limit", club })[],
}[]
```

- `state` is `{ squad, bank }`. A `WeekResult` from `simulatePlan` fits directly, so pass the week before the transfer to get the squad after the moves already planned.
- **Ordering:** every player in the position who isn't in the squad, best for the team first.
  - `gain` is before any hit. It's exact: it matches a full `rateSquad` of the new squad to the hundredth, bench and captaincy included.
- **`blocked`:** a list, not a single value, because one player can break both rules. Your Saka example shows both: "£0.1m over · 3 from Arsenal". An empty list means the squad can take him. `short` is in tenths.
- **`fromGw`:** counts only the weeks from the transfer on. For a move planned in GW9, pass 9.
- **Speed:** a swap only changes one position's list, so each candidate costs a few additions per week, with no line-up search. On Ralph's i3, all 15 lists (2,118 candidates) take 16.5 ms warm and 42 ms on first use, so about 1–3 ms for one list. No bound or shortcut was needed.

## 2. `chipValues(squad, gw, ctx)` from the engine

Returns `{ benchBoost, tripleCaptain: { captain, extra } | null }` for one gameweek, both under the best line-up.

- `benchBoost` is the bench's expected points.
- `extra` is the captain's points again.
- `tripleCaptain` is null when no legal eleven can be picked.

## 3. `no-squad` now carries the name and the date

```ts
{ kind: "no-squad", team: { id, name }, deadline: string | null }
```

`deadline` is the next deadline (ISO): FPL shows a new team's squad once it passes. It's null after the season. `/api/planner?team=` returns them in its 404 body.

## 4. How `getLeaguePaper` is cached

There's no cache on the result, by D1. Everything it reads is cached:
- the standings, for 5 minutes;
- each manager's picks;
- bootstrap and fixtures, hourly.

It then computes projections and rates up to 50 squads. On the preview that took **87 ms warm and 238 ms cold** of server time for Ralph's league. Your own Suspense around it is right. If it shows up as slow in practice, wrapping it in `'use cache: remote'` is a one-line change: the result is about 9 KB and is the same for every visitor.

import { bestLineup } from "./lineup";
import { POSITION_ORDER } from "./rules";
import { type Context, pointsIn } from "./simulate";
import type { Position } from "./types";

// The team rating: what a squad is expected to score over the window if the
// best eleven and captain are picked every week, with no transfers. It's an
// honest points number rather than a mark out of 10, and it can rank every
// squad in a league against each other ("on paper").

export interface SquadRating {
  /** Expected points over the window: best eleven plus captain, each week. */
  readonly points: number;
  /** The same, week by week. */
  readonly perWeek: readonly number[];
  /** Starters' points over the window, by position (the captain counted once). */
  readonly byPosition: Readonly<Record<Position, number>>;
  /** Points the armband adds over the window. */
  readonly captaincy: number;
  /** Every squad player: expected points over the window, and the weeks he'd start. */
  readonly players: readonly { readonly id: number; readonly points: number; readonly starts: number }[];
}

const round = (n: number) => Math.round(n * 100) / 100;

export function rateSquad(squad: readonly number[], ctx: Context): SquadRating {
  const byPosition: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const starts = new Map<number, number>();
  let captaincy = 0;
  const perWeek = ctx.gws.map((gw) => {
    const pointsOf = pointsIn(ctx, gw);
    const lineup = bestLineup(squad, ctx.players, pointsOf, ctx.rules);
    if (!lineup) return 0;
    for (const id of lineup.starters) {
      byPosition[ctx.players.get(id)!.position] += pointsOf(id);
      starts.set(id, (starts.get(id) ?? 0) + 1);
    }
    captaincy += pointsOf(lineup.captain);
    return round(lineup.starters.reduce((s, id) => s + pointsOf(id), 0) + pointsOf(lineup.captain));
  });
  return {
    points: round(perWeek.reduce((a, b) => a + b, 0)),
    perWeek,
    byPosition: Object.fromEntries(POSITION_ORDER.map((p) => [p, round(byPosition[p])])) as Record<Position, number>,
    captaincy: round(captaincy),
    players: squad.map((id) => ({
      id,
      points: round(ctx.players.get(id)?.points.reduce((a, b) => a + b, 0) ?? 0),
      starts: starts.get(id) ?? 0,
    })),
  };
}

/** Squads ranked by rating, best first. Equal ratings share a rank (1, 2, 2, 4). */
export function rankSquads<T extends { readonly squad: readonly number[] }>(entries: readonly T[], ctx: Context) {
  const rated = entries.map((entry) => ({ ...entry, rating: rateSquad(entry.squad, ctx) })).sort((a, b) => b.rating.points - a.rating.points);
  return rated.map((entry) => ({ ...entry, rank: rated.findIndex((r) => r.rating.points === entry.rating.points) + 1 }));
}

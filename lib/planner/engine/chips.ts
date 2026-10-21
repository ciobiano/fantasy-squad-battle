import { bestLineup } from "./lineup";
import { type Context, pointsIn } from "./simulate";

// What Bench Boost and Triple Captain would add in one gameweek, for the chips
// sheet. Free Hit and Wildcard need a squad solver, so they have no number yet.

export interface ChipValues {
  /** The bench's expected points under the best line-up. */
  readonly benchBoost: number;
  /** The captain's extra points on Triple Captain, and who he is; null when no line-up can be picked. */
  readonly tripleCaptain: { readonly captain: number; readonly extra: number } | null;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function chipValues(squad: readonly number[], gw: number, ctx: Context): ChipValues {
  const pointsOf = pointsIn(ctx, gw);
  const lineup = bestLineup(squad, ctx.players, pointsOf, ctx.rules);
  if (!lineup) return { benchBoost: 0, tripleCaptain: null };
  return {
    benchBoost: round(lineup.bench.reduce((sum, id) => sum + pointsOf(id), 0)),
    tripleCaptain: { captain: lineup.captain, extra: round(pointsOf(lineup.captain)) },
  };
}

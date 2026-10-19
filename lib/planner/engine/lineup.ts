import { POSITION_ORDER } from "./rules";
import type { EnginePlayer, Lineup, Position, Rules } from "./types";

// The best starting eleven for a gameweek: every formation FPL allows, each
// filled with the top scorers per position, keeping the highest total. The
// captain and vice are the two best starters. FFS keeps this behind its paywall.

type PointsOf = (id: number) => number;

function formations(rules: Rules, available: Readonly<Record<Position, number>>): Record<Position, number>[] {
  const range = (p: Position) => {
    const { min, max } = rules.positions[p];
    return Array.from({ length: Math.min(max, available[p]) - min + 1 }, (_, i) => min + i);
  };
  const out: Record<Position, number>[] = [];
  for (const GK of range("GK"))
    for (const DEF of range("DEF"))
      for (const MID of range("MID")) {
        const FWD = rules.starters - GK - DEF - MID;
        if (FWD >= rules.positions.FWD.min && FWD <= Math.min(rules.positions.FWD.max, available.FWD)) out.push({ GK, DEF, MID, FWD });
      }
  return out;
}

/** Best first; ties go to the dearer player, then the lower ID, so results are stable. */
const byPoints = (pointsOf: PointsOf, players: ReadonlyMap<number, EnginePlayer>) => (a: number, b: number) =>
  pointsOf(b) - pointsOf(a) || players.get(b)!.price - players.get(a)!.price || a - b;

/** The best line-up from `squad`, or null when no formation FPL allows can be filled. */
export function bestLineup(squad: readonly number[], players: ReadonlyMap<number, EnginePlayer>, pointsOf: PointsOf, rules: Rules): Lineup | null {
  const order = byPoints(pointsOf, players);
  const ranked = Object.fromEntries(
    POSITION_ORDER.map((p) => [p, squad.filter((id) => players.get(id)?.position === p).sort(order)]),
  ) as Record<Position, number[]>;
  const available = Object.fromEntries(POSITION_ORDER.map((p) => [p, ranked[p].length])) as Record<Position, number>;
  let best: { starters: number[]; total: number } | null = null;
  for (const shape of formations(rules, available)) {
    const starters = POSITION_ORDER.flatMap((p) => ranked[p].slice(0, shape[p]));
    const total = starters.reduce((sum, id) => sum + pointsOf(id), 0);
    if (!best || total > best.total + 1e-9) best = { starters, total };
  }
  if (!best) return null;
  return withRoles(best.starters, squad, players, pointsOf);
}

/** Bench order and armbands for a chosen eleven. */
export function withRoles(starters: readonly number[], squad: readonly number[], players: ReadonlyMap<number, EnginePlayer>, pointsOf: PointsOf): Lineup {
  const order = byPoints(pointsOf, players);
  const picked = new Set(starters);
  const rest = squad.filter((id) => !picked.has(id) && players.has(id));
  const isKeeper = (id: number) => players.get(id)!.position === "GK";
  const [captain, vice] = [...starters].sort(order);
  return {
    starters: POSITION_ORDER.flatMap((p) => starters.filter((id) => players.get(id)?.position === p)),
    bench: [...rest.filter(isKeeper).sort(order), ...rest.filter((id) => !isKeeper(id)).sort(order)],
    captain,
    vice: vice ?? captain,
  };
}

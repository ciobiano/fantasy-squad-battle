import type { Chip, EnginePlayer, Issue, Owned, Position, Rules } from "./types";

// FPL's squad rules as checks that return issues, never throw.

export const POSITION_ORDER: readonly Position[] = ["GK", "DEF", "MID", "FWD"];

/** What FPL pays when you sell: the price paid plus half of any rise (rounded down), or today's price after a fall. */
export function sellingPrice(bought: number, now: number, sellOnFee: number): number {
  return now > bought ? bought + Math.floor((now - bought) * sellOnFee) : now;
}

/** Bank plus what the squad would sell for. */
export function squadValue(squad: readonly Owned[], bank: number, players: ReadonlyMap<number, EnginePlayer>, rules: Rules): number {
  return squad.reduce((sum, o) => sum + sellingPrice(o.bought, players.get(o.id)?.price ?? o.bought, rules.sellOnFee), bank);
}

/** Clubs with more players than the limit. */
export function clubIssues(ids: readonly number[], players: ReadonlyMap<number, EnginePlayer>, rules: Rules): Issue[] {
  const count = new Map<number, number>();
  for (const id of ids) {
    const club = players.get(id)?.club;
    if (club !== undefined) count.set(club, (count.get(club) ?? 0) + 1);
  }
  return [...count].filter(([, n]) => n > rules.clubLimit).map(([club]) => ({ kind: "club-limit", club }));
}

/** A starting eleven FPL accepts: the right number, from the squad, within each position's limits. */
export function formationAllowed(starters: readonly number[], squad: ReadonlySet<number>, players: ReadonlyMap<number, EnginePlayer>, rules: Rules): boolean {
  if (starters.length !== rules.starters || new Set(starters).size !== starters.length) return false;
  if (!starters.every((id) => squad.has(id) && players.has(id))) return false;
  return POSITION_ORDER.every((position) => {
    const n = starters.filter((id) => players.get(id)!.position === position).length;
    return n >= rules.positions[position].min && n <= rules.positions[position].max;
  });
}

/** Whether a chip can be played in `gw`: one of its windows covers `gw` and hasn't been used. */
export function chipAvailable(chip: Chip, gw: number, used: readonly { chip: Chip; gw: number }[], rules: Rules): boolean {
  return rules.chips.some(
    (w) => w.chip === chip && gw >= w.from && gw <= w.to && !used.some((u) => u.chip === chip && u.gw >= w.from && u.gw <= w.to),
  );
}

/** Every chip still playable at some point from `gw` on, per half. */
export function chipsLeft(gw: number, used: readonly { chip: Chip; gw: number }[], rules: Rules): { chip: Chip; from: number; to: number }[] {
  return rules.chips
    .filter((w) => w.to >= gw && !used.some((u) => u.chip === w.chip && u.gw >= w.from && u.gw <= w.to))
    .map((w) => ({ ...w, from: Math.max(w.from, gw) }));
}

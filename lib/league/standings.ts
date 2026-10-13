import type { LeagueGameweek, ManagerGameweek } from "@/lib/fpl/league-gameweek";
import type { Manager, Score } from "./types";

// Per-manager facts every view needs: who they are, their score, and their
// league rank at each gameweek (D5).

type HistoryRow = ManagerGameweek["history"]["current"][number];

/** "valentine chukwu" → "Valentine"; "WiLL Shakespeare" → "WiLL" (only all-lowercase names are capitalised). */
export function firstNameOf(playerName: string): string {
  const first = playerName.trim().split(/\s+/)[0] ?? "";
  if (!first || first !== first.toLowerCase()) return first;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function toManager(m: ManagerGameweek, youId?: number): Manager {
  return { id: m.entry, firstName: firstNameOf(m.playerName), teamName: m.entryName.trim(), isYou: m.entry === youId };
}

export function historyAt(m: ManagerGameweek, gw: number): HistoryRow | null {
  return m.history.current.find((row) => row.event === gw) ?? null;
}

/** FPL's gameweek points are before hits; the net score takes the hit cost off. */
export function scoreAt(m: ManagerGameweek, gw: number): Score | null {
  const row = historyAt(m, gw);
  if (!row) return null;
  return { net: row.points - row.event_transfers_cost, points: row.points, hits: row.event_transfers_cost };
}

/**
 * Standard competition ranking: higher values rank first, and equal values
 * share a rank (1, 2, 2, 4). Returns each item's rank in the input order.
 */
export function competitionRanks<T>(items: readonly T[], value: (item: T) => number): number[] {
  const order = items.map((item, index) => ({ v: value(item), index })).sort((a, b) => b.v - a.v);
  const ranks = new Array<number>(items.length);
  order.forEach((entry, pos) => {
    const tiedWithPrevious = pos > 0 && entry.v === order[pos - 1].v;
    ranks[entry.index] = tiedWithPrevious ? ranks[order[pos - 1].index] : pos + 1;
  });
  return ranks;
}

export interface Timeline {
  /** League rank at a gameweek, among the loaded managers who had played by then. */
  rankAt(entry: number, gw: number): number | null;
  /** Average season total at a gameweek, among the managers who had played by then. */
  averageTotalAt(gw: number): number | null;
}

/** League ranks and averages for gameweeks 1..gw, worked out from each manager's season totals. */
export function buildTimeline(bundle: LeagueGameweek): Timeline {
  const byGw = new Map<number, { ranks: Map<number, number>; average: number | null }>();
  for (let gw = 1; gw <= bundle.gameweek.id; gw++) {
    const rows = bundle.managers.flatMap((m) => {
      const row = historyAt(m, gw);
      return row ? [{ entry: m.entry, total: row.total_points }] : [];
    });
    const ranked = competitionRanks(rows, (r) => r.total);
    const ranks = new Map(rows.map((r, i) => [r.entry, ranked[i]]));
    const average = rows.length ? rows.reduce((sum, r) => sum + r.total, 0) / rows.length : null;
    byGw.set(gw, { ranks, average });
  }
  return {
    rankAt: (entry, gw) => byGw.get(gw)?.ranks.get(entry) ?? null,
    averageTotalAt: (gw) => byGw.get(gw)?.average ?? null,
  };
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

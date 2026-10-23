// A draft from scratch (/planner/draft), run in the browser beside the plan
// board: fifteen shirts filled within the budget and the club limit, kept on
// this phone, rated once full, then planned like an imported team. Pure and
// client-safe, like lib/screens/plan-board.ts.
import { POSITION_ORDER, rateSquad, type Blocked, type Context, type Position, type Rules } from "@/lib/planner/engine";
import type { PlannerPlayer } from "@/lib/planner";
import type { BoardData } from "./plan-board";

type Players = ReadonlyMap<number, PlannerPlayer>;

/** Where a draft is kept: one per planning window, so last month's picks don't linger. */
export const draftKey = (firstGw: number): string => `fsb-draft:${firstGw}`;

/** The picks from what's stored: known players, once each, and no more per position than a squad holds. */
export function readDraft(stored: string | null, players: Players, rules: Rules): number[] {
  let list: unknown;
  try {
    list = JSON.parse(stored ?? "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  return list.reduce<number[]>((picks, id) => {
    const player = typeof id === "number" ? players.get(id) : undefined;
    if (!player || picks.includes(player.id)) return picks;
    const held = picks.filter((other) => players.get(other)?.position === player.position).length;
    return held < rules.positions[player.position].squad ? [...picks, player.id] : picks;
  }, []);
}

export const writeDraft = (picks: readonly number[]): string => JSON.stringify(picks);

export interface DraftSlot {
  readonly position: Position;
  /** The player picked for this shirt, or null for an empty one. */
  readonly id: number | null;
}

/** The fifteen shirts, a line per position: picks in the order they were made, then the empty ones. */
export function draftLines(picks: readonly number[], players: Players, rules: Rules): readonly (readonly DraftSlot[])[] {
  return POSITION_ORDER.map((position) => {
    const held = picks.filter((id) => players.get(id)?.position === position);
    return Array.from({ length: rules.positions[position].squad }, (_, i) => ({ position, id: held[i] ?? null }));
  });
}

export interface DraftMoney {
  /** In tenths of a million, like every price. */
  readonly spent: number;
  readonly left: number;
  readonly toPick: number;
}

export function draftMoney(picks: readonly number[], players: Players, rules: Rules): DraftMoney {
  const spent = picks.reduce((sum, id) => sum + (players.get(id)?.price ?? 0), 0);
  return { spent, left: rules.budget - spent, toPick: rules.squadSize - picks.length };
}

function clubCounts(picks: readonly number[], players: Players): ReadonlyMap<number, number> {
  const counts = new Map<number, number>();
  for (const id of picks) {
    const club = players.get(id)?.club;
    if (club !== undefined) counts.set(club, (counts.get(club) ?? 0) + 1);
  }
  return counts;
}

/** Clubs the draft can take no more players from. */
export function fullClubs(picks: readonly number[], players: Players, rules: Rules): number[] {
  return [...clubCounts(picks, players)].filter(([, count]) => count >= rules.clubLimit).map(([club]) => club);
}

export interface DraftChoice {
  readonly id: number;
  /** Projected points over the window. */
  readonly points: number;
  readonly price: number;
  /** Why the draft can't take him; empty when it can. */
  readonly blocked: readonly Blocked[];
}

/** Every player for an empty shirt, most projected points first. Ones the draft can't take stay in the list, with the rule that stops them. */
export function draftChoices(picks: readonly number[], position: Position, data: Pick<BoardData, "players" | "rules">, players: Players): DraftChoice[] {
  const { left } = draftMoney(picks, players, data.rules);
  const clubs = clubCounts(picks, players);
  return data.players
    .filter((p) => p.position === position && !picks.includes(p.id))
    .map((p) => {
      const blocked: Blocked[] = [];
      if (p.price > left) blocked.push({ kind: "over-budget", short: p.price - left });
      if ((clubs.get(p.club) ?? 0) >= data.rules.clubLimit) blocked.push({ kind: "club-limit", club: p.club });
      return { id: p.id, points: p.points.reduce((sum, x) => sum + x, 0), price: p.price, blocked };
    })
    .sort((a, b) => b.points - a.points || b.price - a.price);
}

export const draftFull = (picks: readonly number[], rules: Rules): boolean => picks.length === rules.squadSize;

/** The full draft's rating: expected points with the best eleven and captain each week, no transfers. */
export const draftRating = (picks: readonly number[], ctx: Context): number => rateSquad(picks, ctx).points;

/**
 * A full draft as the plan board's team: bought at today's prices, the change
 * in the bank, and one free transfer to start (a draft has no history).
 */
export function draftTeam(picks: readonly number[], data: BoardData, players: Players): NonNullable<BoardData["team"]> {
  const first = data.gws[0];
  return {
    id: 0,
    name: "",
    asOf: first - 1,
    start: {
      gw: first,
      squad: picks.map((id) => ({ id, bought: players.get(id)?.price ?? 0 })),
      bank: draftMoney(picks, players, data.rules).left,
      freeTransfers: 1,
      chipsUsed: [],
    },
  };
}

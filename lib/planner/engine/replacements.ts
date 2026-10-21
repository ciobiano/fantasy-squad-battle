import { POSITION_ORDER, sellingPrice } from "./rules";
import type { Context } from "./simulate";
import type { EnginePlayer, Owned, Position, Rules } from "./types";

// "Pick a replacement": every player in the outgoing player's position, ranked
// by what he adds to the team over the window, not by his own projection. A
// bench player who'd never start adds nothing. Players the squad can't take
// stay in the list with the rules that block them.
//
// Swapping one player changes only his position's list, so each week's best
// eleven is a few prefix sums over the four position lists, not a full line-up
// search: about 1 ms for 300 candidates, so it runs on the phone as you tap.

export type Blocked = { readonly kind: "over-budget"; readonly short: number } | { readonly kind: "club-limit"; readonly club: number };

export interface Replacement {
  readonly id: number;
  /** Points the team gains over the window from this swap, before any hit (negative when he'd make it worse). */
  readonly gain: number;
  /** Current price, in tenths. */
  readonly price: number;
  /** The rules this swap breaks; empty when the squad can take him. */
  readonly blocked: readonly Blocked[];
}

/** The squad and bank the swap starts from: after the transfers already in the plan. */
export interface SquadState {
  readonly squad: readonly Owned[];
  readonly bank: number;
}

type Lists = Record<Position, number[]>;

/** Every starting shape FPL allows, as players per position. */
export function formationsOf(rules: Rules): Record<Position, number>[] {
  const shapes: Record<Position, number>[] = [];
  const { GK, DEF, MID, FWD } = rules.positions;
  for (let g = GK.min; g <= GK.max; g++)
    for (let d = DEF.min; d <= DEF.max; d++)
      for (let m = MID.min; m <= MID.max; m++) {
        const f = rules.starters - g - d - m;
        if (f >= FWD.min && f <= FWD.max) shapes.push({ GK: g, DEF: d, MID: m, FWD: f });
      }
  return shapes;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** One week, prepared once per outgoing player so each candidate costs a few additions. */
interface Week {
  readonly i: number;
  /** The team's value with the outgoing player. */
  readonly base: number;
  /** The other players in the position, best first, and their running totals (sums[k] = best k). */
  readonly list: readonly number[];
  readonly sums: readonly number[];
  /** Per shape: the other positions' best players added up, and their best single score (the captain if not ours). */
  readonly rest: readonly { readonly k: number; readonly total: number; readonly fits: boolean }[];
  readonly topElsewhere: number;
}

function prepareWeek(i: number, lists: Lists, position: Position, outPoints: number, shapes: readonly Record<Position, number>[]): Week {
  const list = lists[position];
  const sums = [0];
  for (const x of list) sums.push(sums[sums.length - 1] + x);
  const sumOf = (p: Position, k: number) => lists[p].slice(0, k).reduce((a, b) => a + b, 0);
  const rest = shapes.map((shape) => ({
    k: shape[position],
    fits: POSITION_ORDER.every((p) => p === position || lists[p].length >= shape[p]),
    total: POSITION_ORDER.reduce((sum, p) => (p === position ? sum : sum + sumOf(p, shape[p])), 0),
  }));
  const topElsewhere = Math.max(...POSITION_ORDER.filter((p) => p !== position && lists[p].length).map((p) => lists[p][0]));
  const week = { i, base: 0, list, sums, rest, topElsewhere };
  return { ...week, base: valueWith(week, outPoints) };
}

/** The team's best eleven plus captain that week with `points` added to the position. */
function valueWith(week: Omit<Week, "base">, points: number): number {
  const { list, sums } = week;
  let above = 0;
  while (above < list.length && list[above] >= points) above++;
  const captain = Math.max(week.topElsewhere, points, list.length ? list[0] : -Infinity);
  let best = -Infinity;
  for (const shape of week.rest) {
    if (!shape.fits || shape.k > list.length + 1) continue;
    const ours = shape.k <= above ? sums[shape.k] : sums[shape.k - 1] + points;
    if (shape.total + ours > best) best = shape.total + ours;
  }
  return best === -Infinity ? 0 : best + captain;
}

export function replacementsFor(state: SquadState, outId: number, ctx: Context, fromGw = ctx.gws[0]): Replacement[] {
  const out = ctx.players.get(outId);
  const sold = state.squad.find((o) => o.id === outId);
  if (!out || !sold) return [];
  const owned = new Set(state.squad.map((o) => o.id));
  const others = state.squad.map((o) => ctx.players.get(o.id)).filter((p): p is EnginePlayer => p !== undefined && p.id !== outId);
  const shapes = formationsOf(ctx.rules);
  const weeks = ctx.gws.map((gw, i) => ({ gw, i })).filter((w) => w.gw >= fromGw);

  // Each week: the other 14 per position, sorted, prepared once.
  const perWeek = weeks.map(({ i }) => {
    const lists = Object.fromEntries(POSITION_ORDER.map((p) => [p, [] as number[]])) as Lists;
    for (const p of others) lists[p.position].push(p.points[i] ?? 0);
    for (const p of POSITION_ORDER) lists[p].sort((a, b) => b - a);
    return prepareWeek(i, lists, out.position, out.points[i] ?? 0, shapes);
  });

  const clubs = new Map<number, number>();
  for (const p of others) clubs.set(p.club, (clubs.get(p.club) ?? 0) + 1);
  const budget = state.bank + sellingPrice(sold.bought, out.price, ctx.rules.sellOnFee);

  const list: Replacement[] = [];
  for (const c of ctx.players.values()) {
    if (c.position !== out.position || owned.has(c.id)) continue;
    let gain = 0;
    for (const w of perWeek) gain += valueWith(w, c.points[w.i] ?? 0) - w.base;
    const blocked: Blocked[] = [];
    if (c.price > budget) blocked.push({ kind: "over-budget", short: c.price - budget });
    if ((clubs.get(c.club) ?? 0) + 1 > ctx.rules.clubLimit) blocked.push({ kind: "club-limit", club: c.club });
    list.push({ id: c.id, gain: round(gain), price: c.price, blocked });
  }
  return list.sort((a, b) => b.gain - a.gain || a.price - b.price || a.id - b.id);
}

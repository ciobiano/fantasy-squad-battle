// The plan board's logic, run in the browser beside lib/planner/engine: what a
// week shows (fixtures, line-up rows, money and transfers left), how a tap
// changes the plan, and how the plan is kept on the phone. Pure and client-safe:
// type imports only from the server modules.
import {
  chipAvailable, formationAllowed, pointsIn, POSITION_ORDER, sellingPrice, simulatePlan, withRoles,
  type Chip, type Context, type Owned, type PlanResult, type Position, type Start, type Transfer, type WeekPlan, type WeekResult,
} from "@/lib/planner/engine";
import type { PlannerData, PlannerPlayer } from "@/lib/planner";

/** What the board needs from the planner bundle: the squad is optional (a draft has none). */
export type BoardData = Omit<PlannerData, "team"> & {
  readonly team: { readonly id: number; readonly name: string; readonly asOf: number; readonly start: Start } | null;
};

export const contextFor = (data: Pick<BoardData, "players" | "gws" | "rules">): Context => ({
  players: new Map(data.players.map((p) => [p.id, p])),
  gws: data.gws,
  rules: data.rules,
});

export const playerMap = (data: Pick<BoardData, "players">): ReadonlyMap<number, PlannerPlayer> => new Map(data.players.map((p) => [p.id, p]));

// ---------------------------------------------------------------- Fixtures

export interface FixtureWords {
  readonly home: string;
  readonly away: string;
  readonly blank: string;
}

/** A club's matches in one gameweek: "EVE H", "EVE H / LIV A" for a double, or the blank word. */
export function fixtureLabel(data: Pick<BoardData, "outlook" | "clubs">, club: number, gw: number, words: FixtureWords): string {
  const short = new Map(data.clubs.map((c) => [c.id, c.short]));
  const week = data.outlook.find((o) => o.team === club)?.weeks.find((w) => w.gw === gw);
  if (!week || week.matches.length === 0) return words.blank;
  return week.matches.map((m) => `${short.get(m.opponent) ?? "?"} ${m.home ? words.home : words.away}`).join(" / ");
}

/** The next `count` gameweeks' fixtures from `gw`, for a player row: "BOU H · CHE A · AVL H". */
export function nextFixtures(data: Pick<BoardData, "outlook" | "clubs" | "gws">, club: number, gw: number, count: number, words: FixtureWords): string {
  return data.gws
    .filter((g) => g >= gw)
    .slice(0, count)
    .map((g) => fixtureLabel(data, club, g, words))
    .join(" · ");
}

// ---------------------------------------------------------------- One week on the board

/** The starters in pitch rows, goalkeeper first, each row ordered as the engine picked them. */
export function rowsOf(starters: readonly number[], players: ReadonlyMap<number, PlannerPlayer>): readonly (readonly number[])[] {
  return POSITION_ORDER.map((pos: Position) => starters.filter((id) => players.get(id)?.position === pos)).filter((row) => row.length > 0);
}

/** Free transfers still unused this week; Wildcard and Free Hit weeks have no limit (null). */
export function freeLeft(week: WeekResult): number | null {
  if (week.chip === "wildcard" || week.chip === "freehit") return null;
  return Math.max(0, week.freeTransfers - week.transfers.length);
}

/** What one more transfer this week would cost in points. */
export function nextTransferCost(week: WeekResult, hitCost: number): number {
  const left = freeLeft(week);
  return left === null || left > 0 ? 0 : hitCost;
}

/** A player's projected points for the week as the board shows them: doubled for the captain, tripled on Triple Captain. */
export function shownPoints(week: WeekResult, id: number, ctx: Context): number {
  const base = pointsIn(ctx, week.gw)(id);
  if (id !== week.captain) return base;
  return base * (week.chip === "3xc" ? 3 : 2);
}

/** The squad member's estimated selling price this week, in tenths. */
export function sellPrice(week: WeekResult, id: number, ctx: Context): number {
  const owned = week.squad.find((o) => o.id === id);
  const player = ctx.players.get(id);
  return owned && player ? sellingPrice(owned.bought, player.price, ctx.rules.sellOnFee) : (player?.price ?? 0);
}

// ---------------------------------------------------------------- Changing the plan

/** An empty plan: one week per gameweek of the window, the engine picking each line-up. */
export const emptyPlan = (gws: readonly number[]): WeekPlan[] => gws.map((gw) => ({ gw, transfers: [] }));

const replaceWeek = (weeks: readonly WeekPlan[], gw: number, change: (week: WeekPlan) => WeekPlan): WeekPlan[] =>
  weeks.map((w) => (w.gw === gw ? change(w) : w));

/** Adds a transfer to a week. Later weeks' line-up choices are cleared, since the squad they were made for has changed. */
export function addTransfer(weeks: readonly WeekPlan[], gw: number, t: Transfer): WeekPlan[] {
  return weeks.map((w) => {
    if (w.gw === gw) return { gw: w.gw, transfers: [...w.transfers, t], chip: w.chip };
    if (w.gw > gw) return { gw: w.gw, transfers: w.transfers, chip: w.chip };
    return w;
  });
}

/** Moves a planned transfer from one week to another (the "free next week" tip). */
export function moveTransfer(weeks: readonly WeekPlan[], from: number, to: number, t: Transfer): WeekPlan[] {
  const without = replaceWeek(weeks, from, (w) => ({ ...w, transfers: w.transfers.filter((x) => x.out !== t.out || x.in !== t.in) }));
  return addTransfer(without, to, t);
}

export const setCaptain = (weeks: readonly WeekPlan[], week: WeekResult, id: number): WeekPlan[] =>
  replaceWeek(weeks, week.gw, (w) => ({ ...w, starters: week.starters, captain: id, vice: id === week.vice ? week.captain : week.vice }));

export const setChip = (weeks: readonly WeekPlan[], gw: number, chip: Chip | null): WeekPlan[] =>
  replaceWeek(weeks, gw, (w) => ({ ...w, chip }));

/**
 * "Start him": the bench player comes in for the starter whose place keeps a
 * legal formation and who's projected to score least. Null when no swap is legal.
 */
export function startFromBench(week: WeekResult, benchId: number, ctx: Context): readonly number[] | null {
  const pointsOf = pointsIn(ctx, week.gw);
  const squad = new Set(week.squad.map((o) => o.id));
  const options = week.starters
    .map((out) => week.starters.map((id) => (id === out ? benchId : id)))
    .filter((starters) => formationAllowed(starters, squad, ctx.players, ctx.rules));
  if (options.length === 0) return null;
  const total = (starters: readonly number[]) => starters.reduce((sum, id) => sum + pointsOf(id), 0);
  return options.reduce((best, s) => (total(s) > total(best) ? s : best));
}

export function startPlayer(weeks: readonly WeekPlan[], week: WeekResult, benchId: number, ctx: Context): WeekPlan[] | null {
  const starters = startFromBench(week, benchId, ctx);
  if (!starters) return null;
  const roles = withRoles(starters, week.squad.map((o) => o.id), ctx.players, pointsIn(ctx, week.gw));
  const captain = starters.includes(week.captain) ? week.captain : roles.captain;
  return replaceWeek(weeks, week.gw, (w) => ({ ...w, starters, captain, vice: starters.includes(week.vice) && week.vice !== captain ? week.vice : roles.vice }));
}

/** Whether a chip can be played in a week, given the chips used before and the ones the plan plays elsewhere. */
export function chipOpen(chip: Chip, gw: number, start: Start, weeks: readonly WeekPlan[], ctx: Context): boolean {
  const planned = weeks.filter((w) => w.chip && w.gw !== gw).map((w) => ({ chip: w.chip as Chip, gw: w.gw }));
  return chipAvailable(chip, gw, [...start.chipsUsed, ...planned], ctx.rules);
}

/**
 * What a transfer adds to the plan if made this week, and if made next week
 * instead; the board suggests waiting when next week is free and worth more.
 */
export function transferOptions(start: Start, weeks: readonly WeekPlan[], gw: number, t: Transfer, ctx: Context): { now: number; later: { gw: number; gain: number } | null } {
  const base = simulatePlan(start, weeks, ctx);
  const now = simulatePlan(start, addTransfer(weeks, gw, t), ctx).points - base.points;
  const next = ctx.gws.find((g) => g > gw);
  if (next === undefined) return { now, later: null };
  const later = simulatePlan(start, addTransfer(weeks, next, t), ctx);
  const hitsIn = (result: PlanResult) => result.weeks.find((w) => w.gw === next)?.hits ?? 0;
  return { now, later: hitsIn(later) === hitsIn(base) ? { gw: next, gain: later.points - base.points } : null };
}

export type ChipState =
  | { readonly kind: "playing" }
  /** Played already in this half (before the plan, or in another week of it). */
  | { readonly kind: "used"; readonly gw: number }
  /** What it would add this week, and for Triple Captain whose armband. */
  | { readonly kind: "gain"; readonly points: number; readonly captain: number | null }
  /** Playable, with no number until there's a squad solver (Free Hit, Wildcard). */
  | { readonly kind: "open" }
  /** Not playable this week. */
  | { readonly kind: "closed" };

/** What a chip means in a week of the plan. Bench Boost and Triple Captain are worth the week's bench and captain as shown. */
export function chipState(chip: Chip, week: WeekResult, start: Start, plan: readonly WeekPlan[], ctx: Context): ChipState {
  if (week.chip === chip) return { kind: "playing" };
  const window = ctx.rules.chips.find((w) => w.chip === chip && w.from <= week.gw && week.gw <= w.to);
  const inWindow = (gw: number) => window !== undefined && window.from <= gw && gw <= window.to;
  const used = [...start.chipsUsed, ...plan.filter((w) => w.chip === chip && w.gw !== week.gw).map((w) => ({ chip, gw: w.gw }))]
    .find((u) => u.chip === chip && inWindow(u.gw));
  if (used) return { kind: "used", gw: used.gw };
  if (!chipOpen(chip, week.gw, start, plan, ctx)) return { kind: "closed" };
  const pointsOf = pointsIn(ctx, week.gw);
  if (chip === "bboost") return { kind: "gain", points: week.bench.reduce((sum, id) => sum + pointsOf(id), 0), captain: null };
  if (chip === "3xc") return { kind: "gain", points: pointsOf(week.captain), captain: week.captain };
  return { kind: "open" };
}

// ---------------------------------------------------------------- Kept on the phone

export const planKey = (teamId: number | null, firstGw: number): string => `fsb-plan:${teamId ?? "draft"}:${firstGw}`;

/** A saved plan, checked against this window and these players; anything unreadable is an empty plan. */
export function readPlan(stored: string | null, gws: readonly number[], players: ReadonlyMap<number, unknown>): WeekPlan[] {
  const empty = emptyPlan(gws);
  try {
    const saved: unknown = JSON.parse(stored ?? "null");
    if (!Array.isArray(saved)) return empty;
    const id = (v: unknown): v is number => typeof v === "number" && players.has(v);
    return empty.map((week) => {
      const w = saved.find((x) => x && typeof x === "object" && (x as { gw?: unknown }).gw === week.gw) as Record<string, unknown> | undefined;
      if (!w) return week;
      const transfers = Array.isArray(w.transfers)
        ? (w.transfers as unknown[]).filter((t): t is Transfer => !!t && typeof t === "object" && id((t as Transfer).out) && id((t as Transfer).in))
        : [];
      const chip = ["wildcard", "freehit", "bboost", "3xc"].includes(w.chip as string) ? (w.chip as Chip) : null;
      const starters = Array.isArray(w.starters) && w.starters.every(id) ? (w.starters as number[]) : undefined;
      return {
        gw: week.gw,
        transfers,
        chip,
        ...(starters ? { starters } : {}),
        ...(id(w.captain) ? { captain: w.captain } : {}),
        ...(id(w.vice) ? { vice: w.vice } : {}),
      };
    });
  } catch {
    return empty;
  }
}

/** The plan as stored: only weeks that change something. */
export const writePlan = (weeks: readonly WeekPlan[]): string =>
  JSON.stringify(weeks.filter((w) => w.transfers.length > 0 || w.chip || w.starters || w.captain !== undefined));

// ---------------------------------------------------------------- Review

export interface ReviewWeek {
  readonly gw: number;
  readonly points: number;
  readonly transfers: readonly Transfer[];
  readonly hits: number;
  readonly chip: Chip | null;
  readonly captain: number;
}

export function review(result: PlanResult, base: PlanResult, hitCost: number): { readonly gain: number; readonly points: number; readonly base: number; readonly weeks: readonly ReviewWeek[] } {
  return {
    gain: result.points - base.points,
    points: result.points,
    base: base.points,
    weeks: result.weeks.map((w) => ({ gw: w.gw, points: w.points, transfers: w.transfers, hits: w.hits * hitCost, chip: w.chip, captain: w.captain })),
  };
}

export type { Owned, PlannerPlayer };

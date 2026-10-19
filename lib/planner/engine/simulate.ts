import { bestLineup, withRoles } from "./lineup";
import { chipAvailable, clubIssues, formationAllowed, sellingPrice } from "./rules";
import type { Chip, EnginePlayer, Issue, Lineup, Owned, PlanResult, Rules, Start, Transfer, WeekPlan, WeekResult } from "./types";

// Plays a plan forward one gameweek at a time: transfers and their cost, free
// transfers saved and spent, chips, the line-up and captain, and the expected
// points. Rule breaks come back as issues on the week; a transfer that breaks
// one is left out, so the rest of the plan still adds up.

export interface Context {
  readonly players: ReadonlyMap<number, EnginePlayer>;
  /** The gameweeks the players' points cover, in order. */
  readonly gws: readonly number[];
  readonly rules: Rules;
}

interface State {
  readonly squad: readonly Owned[];
  readonly bank: number;
  readonly freeTransfers: number;
  readonly chipsUsed: readonly { chip: Chip; gw: number }[];
}

const FREE_CHIPS: ReadonlySet<Chip | null> = new Set(["wildcard", "freehit"]);

/** A player's expected points in `gw` (0 outside the window or for an unknown player). */
export const pointsIn = (ctx: Context, gw: number) => {
  const i = ctx.gws.indexOf(gw);
  return (id: number) => (i < 0 ? 0 : (ctx.players.get(id)?.points[i] ?? 0));
};

/** One transfer against the squad so far: the new squad and bank, or why it can't be made. */
function transfer(state: { squad: readonly Owned[]; bank: number }, t: Transfer, ctx: Context): { squad: Owned[]; bank: number } | Issue {
  const [out, incoming] = [ctx.players.get(t.out), ctx.players.get(t.in)];
  if (!incoming) return { kind: "unknown-player", player: t.in };
  const owned = state.squad.find((o) => o.id === t.out);
  if (!owned || !out) return { kind: "not-owned", player: t.out };
  if (state.squad.some((o) => o.id === t.in)) return { kind: "already-owned", player: t.in };
  if (out.position !== incoming.position) return { kind: "position-mismatch", out: t.out, in: t.in };
  const bank = state.bank + sellingPrice(owned.bought, out.price, ctx.rules.sellOnFee) - incoming.price;
  const squad = state.squad.map((o) => (o.id === t.out ? { id: t.in, bought: incoming.price } : o));
  const clubs = clubIssues(squad.map((o) => o.id), ctx.players, ctx.rules);
  if (clubs.length) return clubs[0];
  return { squad, bank };
}

function lineupFor(plan: WeekPlan, squad: readonly number[], ctx: Context, issues: Issue[]): Lineup | null {
  const pointsOf = pointsIn(ctx, plan.gw);
  let lineup: Lineup | null = null;
  if (plan.starters) {
    if (formationAllowed(plan.starters, new Set(squad), ctx.players, ctx.rules)) lineup = withRoles(plan.starters, squad, ctx.players, pointsOf);
    else issues.push({ kind: "formation" });
  }
  lineup ??= bestLineup(squad, ctx.players, pointsOf, ctx.rules);
  if (!lineup) return null;
  const starting = new Set(lineup.starters);
  if (plan.captain !== undefined && !starting.has(plan.captain)) issues.push({ kind: "captain-not-starting" });
  const captain = plan.captain !== undefined && starting.has(plan.captain) ? plan.captain : lineup.captain;
  const vice = plan.vice !== undefined && starting.has(plan.vice) && plan.vice !== captain ? plan.vice : lineup.vice === captain ? lineup.captain : lineup.vice;
  return { ...lineup, captain, vice };
}

function playWeek(state: State, plan: WeekPlan, ctx: Context): { result: WeekResult; next: State } {
  const issues: Issue[] = [];
  const chip = plan.chip ?? null;
  const chipOk = chip === null || chipAvailable(chip, plan.gw, state.chipsUsed, ctx.rules);
  if (!chipOk) issues.push({ kind: "chip-unavailable", chip: chip! });
  const played = chipOk ? chip : null;

  let after: { squad: readonly Owned[]; bank: number } = { squad: state.squad, bank: state.bank };
  const made: Transfer[] = [];
  for (const t of plan.transfers) {
    const outcome = transfer(after, t, ctx);
    if ("kind" in outcome) issues.push(outcome);
    else {
      after = outcome;
      made.push(t);
    }
  }
  if (after.bank < 0) issues.push({ kind: "over-budget", short: -after.bank });
  const free = FREE_CHIPS.has(played);
  if (!free && made.length > ctx.rules.transfersCap) issues.push({ kind: "transfer-cap" });
  const hits = free ? 0 : Math.max(0, made.length - state.freeTransfers);

  const ids = after.squad.map((o) => o.id);
  const lineup = lineupFor(plan, ids, ctx, issues) ?? { starters: [], bench: ids, captain: ids[0], vice: ids[0] };
  const pointsOf = pointsIn(ctx, plan.gw);
  const sum = (list: readonly number[]) => list.reduce((s, id) => s + pointsOf(id), 0);
  const captainExtra = lineup.starters.length ? pointsOf(lineup.captain) * (played === "3xc" ? 2 : 1) : 0;
  const points = sum(lineup.starters) + captainExtra + (played === "bboost" ? sum(lineup.bench) : 0) - hits * ctx.rules.hitCost;

  const result: WeekResult = {
    gw: plan.gw,
    squad: after.squad,
    bank: after.bank,
    freeTransfers: state.freeTransfers,
    transfers: made,
    hits,
    chip: played,
    ...lineup,
    points: Math.round(points * 100) / 100,
    issues,
  };
  const freeNext = free ? state.freeTransfers : Math.min(ctx.rules.maxFreeTransfers, Math.max(0, state.freeTransfers - made.length) + 1);
  // A Free Hit squad lasts one week: the old squad and bank come back.
  const keep = played === "freehit" ? { squad: state.squad, bank: state.bank } : after;
  const chipsUsed = played ? [...state.chipsUsed, { chip: played, gw: plan.gw }] : state.chipsUsed;
  return { result, next: { ...keep, freeTransfers: freeNext, chipsUsed } };
}

/** Plays `plan` from `start`. Weeks run in gameweek order; a week the plan skips is played with no transfers. */
export function simulatePlan(start: Start, plan: readonly WeekPlan[], ctx: Context): PlanResult {
  const last = Math.max(start.gw, ...plan.map((w) => w.gw));
  const byGw = new Map(plan.map((w) => [w.gw, w]));
  let state: State = { squad: start.squad, bank: start.bank, freeTransfers: start.freeTransfers, chipsUsed: start.chipsUsed };
  const weeks: WeekResult[] = [];
  for (let gw = start.gw; gw <= last; gw++) {
    const { result, next } = playWeek(state, byGw.get(gw) ?? { gw, transfers: [] }, ctx);
    weeks.push(result);
    state = next;
  }
  return {
    weeks,
    points: Math.round(weeks.reduce((s, w) => s + w.points, 0) * 100) / 100,
    valid: weeks.every((w) => w.issues.length === 0),
  };
}

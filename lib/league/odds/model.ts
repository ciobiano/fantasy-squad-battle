import type { History } from "@/lib/fpl/schemas";

// What each manager is expected to score from here: their "edge" over FPL's
// gameweek average, and whether they're still playing. Calibrated on 20 Oct
// 2026 from 265 managers in 12 friend leagues, GW1–7; the study and backtest
// are in docs/research/2026-10-20-title-odds.md. Measured numbers say so;
// the rest are assumptions to check again around GW15.

/** Weekly luck: how far a score strays from the gameweek average, sd in points (measured: 12.4). */
export const WEEKLY_LUCK = 12.4;
/** How much real skill differs between managers, sd in points a gameweek (measured 3–4.8; backtest best near 4). */
export const SKILL_SPREAD = 4;

/** Edge this season per point a gameweek a manager averaged last season (measured 0.24; backtest best 0.24–0.4). */
export const LAST_SEASON_WEIGHT = 0.3;
/** Last season's average in the sample, points a gameweek (measured). */
export const LAST_SEASON_AVERAGE = 52.3;
/** The sample's edge over FPL's average this season, points a gameweek (measured). */
export const RETURNING_EDGE = 1.3;
/** Managers with no earlier season, points a gameweek against FPL's average (measured on 18). */
export const NEW_MANAGER_EDGE = -3.8;

/** Weeks without a transfer before a manager counts as quiet (a saver can hold 5 free transfers). */
export const QUIET_WEEKS = 3;
/** A quiet manager with this many unavailable starters has stopped playing: a ghost. */
export const GHOST_NEGLECT = 2;
/** Weeks without a transfer that make a ghost whatever the line-up. */
export const GHOST_WEEKS = 6;
/** A ghost scores this much less again each week (measured about 1 on untouched teams), up to GHOST_FLOOR. */
export const GHOST_DECLINE = 1;
/** The most a ghost falls below their old level, points a gameweek (assumption: abandoned teams score about 30). */
export const GHOST_FLOOR = 20;
/** Chance a playing manager quits in a given week (assumption: 2.8% a week go quiet, about half only saving transfers). */
export const QUIT_CHANCE = 0.015;
/** Chance a ghost comes back in a given week, and stops sliding (measured 9–16% a week among quiet managers). */
export const COMEBACK_CHANCE = 0.1;

/** First-half chips expire at this gameweek's end; the second half gives everyone a full set again. */
export const FIRST_HALF_END = 19;
/** Points a chip adds when played. Bench Boost: the measured 6.6 on the bench a week; the rest are assumptions. */
export const CHIP_VALUE: Readonly<Record<string, number>> = { bboost: 6.6, "3xc": 7, freehit: 4, wildcard: 4 };

export type Activity = "active" | "quiet" | "ghost";

export interface Outlook {
  readonly entry: number;
  /** Season total after `gw`, net of hits. */
  readonly total: number;
  /** Expected points a gameweek over FPL's average from here. */
  readonly edge: number;
  readonly activity: Activity;
  /** Gameweeks since the last transfer, Wildcard or Free Hit (or since starting). */
  readonly idleWeeks: number;
  /** Expected points still to come from first-half chips. */
  readonly chipPoints: number;
}

export interface OutlookInput {
  readonly entry: number;
  readonly history: History;
  /** The odds are worked out after this gameweek; later rows are ignored. */
  readonly gw: number;
  /** FPL's average score for each gameweek. */
  readonly averages: ReadonlyMap<number, number>;
  /** Starting eleven players at the last deadline who are injured, suspended or gone. */
  readonly unavailableStarters: number;
}

const TRANSFER_CHIPS: ReadonlySet<string> = new Set(["wildcard", "freehit"]);

/** Expected edge before this season's scores: from last season, or the new-manager level. */
export function priorEdge(past: History["past"]): number {
  const last = [...(past ?? [])].sort((a, b) => b.season_name.localeCompare(a.season_name))[0];
  return last ? RETURNING_EDGE + LAST_SEASON_WEIGHT * (last.total_points / 38 - LAST_SEASON_AVERAGE) : NEW_MANAGER_EDGE;
}

/** This season's edge so far, trusted more with every gameweek played (most early form is luck). */
export function skillEdge(margins: readonly number[], prior: number): number {
  if (!margins.length) return prior;
  const mean = margins.reduce((a, b) => a + b, 0) / margins.length;
  const trust = SKILL_SPREAD ** 2 / (SKILL_SPREAD ** 2 + WEEKLY_LUCK ** 2 / margins.length);
  return prior + trust * (mean - prior);
}

export function activityOf(idleWeeks: number, unavailableStarters: number): Activity {
  if (idleWeeks >= GHOST_WEEKS || (idleWeeks >= QUIET_WEEKS && unavailableStarters >= GHOST_NEGLECT)) return "ghost";
  return idleWeeks >= QUIET_WEEKS ? "quiet" : "active";
}

export function outlookOf({ entry, history, gw, averages, unavailableStarters }: OutlookInput): Outlook {
  const rows = history.current.filter((r) => r.event <= gw);
  const chips = history.chips.filter((c) => c.event <= gw);
  const total = rows.find((r) => r.event === gw)?.total_points ?? rows.at(-1)?.total_points ?? 0;
  const margins = rows.flatMap((r) => {
    const average = averages.get(r.event);
    return average === undefined ? [] : [r.points - r.event_transfers_cost - average];
  });
  const started = rows.length ? Math.min(...rows.map((r) => r.event)) : gw;
  const moves = [...rows.filter((r) => r.event_transfers > 0).map((r) => r.event), ...chips.filter((c) => TRANSFER_CHIPS.has(c.name)).map((c) => c.event)];
  const idleWeeks = gw - Math.max(started, ...moves);
  const activity = activityOf(idleWeeks, unavailableStarters);
  const unused = Object.keys(CHIP_VALUE).filter((chip) => !chips.some((c) => c.name === chip && c.event <= FIRST_HALF_END));
  const chipPoints = gw < FIRST_HALF_END && activity !== "ghost" ? unused.reduce((sum, chip) => sum + CHIP_VALUE[chip], 0) : 0;
  return { entry, total, edge: skillEdge(margins, priorEdge(history.past)), activity, idleWeeks, chipPoints };
}

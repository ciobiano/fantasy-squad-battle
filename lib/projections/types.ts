// Our own projections (CLAUDE.md, D7): expected FPL points per player per
// gameweek, built from free FPL data. Plain arrays and records, so a screen
// can send them to the browser for the planner as they are.

export type Position = "GK" | "DEF" | "MID" | "FWD";

/** A club's strength from its season so far, per match, after shrinking toward the league average. */
export interface TeamStrength {
  readonly team: number;
  readonly played: number;
  /** Expected goals scored per match. */
  readonly attack: number;
  /** Expected goals conceded per match. */
  readonly defence: number;
}

/** One match as seen from one side. */
export interface MatchOutlook {
  /** The opponent's team ID. */
  readonly opponent: number;
  readonly home: boolean;
  /** Goals this side is expected to score. */
  readonly goalsFor: number;
  /** Goals this side is expected to concede. */
  readonly goalsAgainst: number;
  /** Chance of keeping a clean sheet, 0–1. */
  readonly cleanSheet: number;
}

export interface TeamOutlook {
  readonly team: number;
  /** Every gameweek of the window: [] is a blank, two matches a double. */
  readonly weeks: readonly { readonly gw: number; readonly matches: readonly MatchOutlook[] }[];
}

export interface PlayerProjection {
  readonly id: number;
  /** Expected points for each gameweek of the window, in order; 0 in a blank week or when ruled out. */
  readonly points: readonly number[];
  /** Sum of `points`. */
  readonly total: number;
  /** Minutes per match when available, from the season so far. */
  readonly minutes: number;
}

export interface Projections {
  /** The gameweeks projected, from the next deadline. */
  readonly gws: readonly number[];
  readonly teams: readonly TeamOutlook[];
  readonly players: readonly PlayerProjection[];
}

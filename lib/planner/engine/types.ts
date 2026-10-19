import type { Position } from "@/lib/projections/types";

// The planner's rules engine works on these plain shapes. It runs on the
// server for the team rating and in the browser for the planner screen, so
// nothing here may fetch or import server code. Money is in tenths of a
// million, as FPL sends it (55 = £5.5m).

export type { Position };

export type Chip = "wildcard" | "freehit" | "bboost" | "3xc";

/** FPL's squad rules, read from bootstrap by lib/planner/rules.ts. */
export interface Rules {
  readonly squadSize: number;
  readonly starters: number;
  readonly clubLimit: number;
  /** Starting budget, in tenths. */
  readonly budget: number;
  /** Share of a price rise kept on selling (0.5). */
  readonly sellOnFee: number;
  /** Most free transfers that can be held at once (1 + FPL's extra 4). */
  readonly maxFreeTransfers: number;
  /** Most transfers in one week, Wildcard and Free Hit aside. */
  readonly transfersCap: number;
  /** Points taken for each transfer beyond the free ones. */
  readonly hitCost: number;
  readonly positions: Readonly<Record<Position, { readonly squad: number; readonly min: number; readonly max: number }>>;
  /** When each chip can be played: two of each per season, one per half. */
  readonly chips: readonly { readonly chip: Chip; readonly from: number; readonly to: number }[];
}

/** What the engine needs of a player. Screens may send more fields alongside. */
export interface EnginePlayer {
  readonly id: number;
  /** Club (team) ID. */
  readonly club: number;
  readonly position: Position;
  /** Current price, in tenths. */
  readonly price: number;
  /** Our expected points for each gameweek of the window (lib/projections). */
  readonly points: readonly number[];
}

/** A player in the squad, with the price paid (for the selling price). */
export interface Owned {
  readonly id: number;
  /** Price paid, in tenths. An estimate when imported: see lib/planner/import.ts. */
  readonly bought: number;
}

/** Where a plan starts: the squad after the last deadline. */
export interface Start {
  /** The first gameweek to plan: the next deadline. */
  readonly gw: number;
  readonly squad: readonly Owned[];
  /** Money in the bank, in tenths. */
  readonly bank: number;
  /** Free transfers for `gw`. An estimate when imported (FPL shows it only to the owner). */
  readonly freeTransfers: number;
  /** Chips already played this season. */
  readonly chipsUsed: readonly { readonly chip: Chip; readonly gw: number }[];
}

export interface Transfer {
  readonly out: number;
  readonly in: number;
}

/** One gameweek of a plan. Leave out the line-up and captain to have the engine pick the best. */
export interface WeekPlan {
  readonly gw: number;
  readonly transfers: readonly Transfer[];
  readonly chip?: Chip | null;
  /** The starting eleven; the rest is the bench. */
  readonly starters?: readonly number[];
  readonly captain?: number;
  readonly vice?: number;
}

export type Issue =
  | { readonly kind: "unknown-player"; readonly player: number }
  | { readonly kind: "not-owned"; readonly player: number }
  | { readonly kind: "already-owned"; readonly player: number }
  | { readonly kind: "position-mismatch"; readonly out: number; readonly in: number }
  | { readonly kind: "over-budget"; readonly short: number }
  | { readonly kind: "club-limit"; readonly club: number }
  | { readonly kind: "transfer-cap" }
  | { readonly kind: "chip-unavailable"; readonly chip: Chip }
  | { readonly kind: "formation" }
  | { readonly kind: "captain-not-starting" };

export interface Lineup {
  readonly starters: readonly number[];
  /** Goalkeeper first, then outfielders in the order they'd come on. */
  readonly bench: readonly number[];
  readonly captain: number;
  readonly vice: number;
}

export interface WeekResult extends Lineup {
  readonly gw: number;
  readonly squad: readonly Owned[];
  /** Bank after this week's transfers, in tenths. */
  readonly bank: number;
  /** Free transfers available before this week's transfers. */
  readonly freeTransfers: number;
  readonly transfers: readonly Transfer[];
  /** Transfers paid for with points. */
  readonly hits: number;
  readonly chip: Chip | null;
  /** Expected points for the week, after hits. */
  readonly points: number;
  /** Rules this week breaks. Transfers that break one are left out of the week. */
  readonly issues: readonly Issue[];
}

export interface PlanResult {
  readonly weeks: readonly WeekResult[];
  /** Expected points over the plan, after hits. */
  readonly points: number;
  /** True when no week breaks a rule. */
  readonly valid: boolean;
}

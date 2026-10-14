// What the Fixtures and Players tabs read: the shapes agreed with the design
// session (docs/handoff/2026-10-10-scope-update-for-design.md), which its
// lib/screens/tools.ts declares too. Once both branches are on main, the
// screens import these instead.

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface TickerMatch {
  /** The opponent's short name, e.g. "LIV". */
  readonly opponent: string;
  readonly home: boolean;
  /** FPL's difficulty for this team: 1 easiest, 5 hardest. */
  readonly difficulty: Difficulty;
}

export interface TickerRow {
  readonly team: { readonly id: number; readonly name: string; readonly short: string };
  readonly weeks: readonly {
    readonly gw: number;
    /** [] is a blank week; two entries are a double. */
    readonly matches: readonly TickerMatch[];
  }[];
  /** Total difficulty over the window; lower is easier. Blanks and doubles: see weekCost. */
  readonly runScore: number;
}

export type InjuryStatus = "injured" | "doubtful" | "suspended" | "unavailable";

export interface InjuryRow {
  readonly player: string;
  /** Club short name, e.g. "LIV". */
  readonly team: string;
  readonly position: "GK" | "DEF" | "MID" | "FWD";
  readonly status: InjuryStatus;
  /** Chance of playing next round; set for doubtful players, 0 for most others. */
  readonly chance: 0 | 25 | 50 | 75 | 100 | null;
  readonly news: string;
  /** ISO date-time the news was added ("" if FPL sent none). */
  readonly reportedAt: string;
}

export interface InjuryReport {
  /** Every flagged player, newest news first, including "unavailable" (mostly loans and transfers out). */
  readonly rows: readonly InjuryRow[];
  /** Every club's short name, for the team filter. */
  readonly clubs: readonly string[];
  /** When the news was read (ms); report ages are measured from it. */
  readonly asOf: number;
}

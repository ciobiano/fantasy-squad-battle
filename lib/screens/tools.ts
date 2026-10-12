// View models for the Fixtures and Players tabs, in the shapes agreed with the
// data session (docs/handoff/2026-10-10-scope-update-for-design.md). lib/tools
// will produce TickerRow and InjuryRow; these functions only sort and filter.

export interface TickerRow {
  readonly team: { readonly id: number; readonly name: string; readonly short: string };
  readonly weeks: readonly {
    readonly gw: number;
    /** [] is a blank week; two entries are a double. */
    readonly matches: readonly { readonly opponent: string; readonly home: boolean; readonly difficulty: 1 | 2 | 3 | 4 | 5 }[];
  }[];
  /** Total difficulty over the window; lower is easier. */
  readonly runScore: number;
}

export type InjuryStatus = "injured" | "doubtful" | "suspended" | "unavailable";

export interface InjuryRow {
  readonly player: string;
  /** Club short name, e.g. "LIV". */
  readonly team: string;
  readonly position: "GK" | "DEF" | "MID" | "FWD";
  readonly status: InjuryStatus;
  readonly chance: 0 | 25 | 50 | 75 | 100 | null;
  readonly news: string;
  /** ISO date-time the news was added. */
  readonly reportedAt: string;
}

export type TickerSort = "easy" | "az";

/** Easiest run first (ties by name), or alphabetical by short name. Never changes the input. */
export function sortTicker(rows: readonly TickerRow[], sort: TickerSort): readonly TickerRow[] {
  const byName = (a: TickerRow, b: TickerRow) => a.team.short.localeCompare(b.team.short);
  return [...rows].sort(sort === "az" ? byName : (a, b) => a.runScore - b.runScore || byName(a, b));
}

/** The gameweeks shown as columns, from the first row. */
export const tickerGameweeks = (rows: readonly TickerRow[]): readonly number[] => rows[0]?.weeks.map((w) => w.gw) ?? [];

export type InjuryFilter = "all" | InjuryStatus;

/**
 * "All" means players who could be in a squad: injured, doubtful, suspended.
 * Unavailable (mostly loans and transfers out, about half of FPL's flags) has its own filter.
 */
export function filterInjuries(rows: readonly InjuryRow[], status: InjuryFilter, team: string | null): readonly InjuryRow[] {
  return rows.filter(
    (row) => (status === "all" ? row.status !== "unavailable" : row.status === status) && (team === null || row.team === team),
  );
}

export function injuryCounts(rows: readonly InjuryRow[], team: string | null): Record<InjuryFilter, number> {
  const scoped = team === null ? rows : rows.filter((row) => row.team === team);
  const count = (status: InjuryStatus) => scoped.filter((row) => row.status === status).length;
  const injured = count("injured");
  const doubtful = count("doubtful");
  const suspended = count("suspended");
  return { all: injured + doubtful + suspended, injured, doubtful, suspended, unavailable: count("unavailable") };
}

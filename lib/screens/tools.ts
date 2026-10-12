// What the Fixtures and Players tabs read, in the shapes agreed with the data
// session (docs/handoff/2026-10-10-scope-update-for-design.md). lib/tools will
// provide a live ToolsSource; until then the 12 Oct snapshot stands in.
import { INJURY_SAMPLE, SNAPSHOT_TAKEN_AT, TICKER_SAMPLE } from "./tools-sample";

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

export interface InjuryReport {
  /** Every flagged player, including "unavailable" (mostly loans and transfers out). */
  readonly rows: readonly InjuryRow[];
  /** Every club's short name, for the team filter. */
  readonly clubs: readonly string[];
  /** When the news was read (ms); report ages are measured from it. */
  readonly asOf: number;
}

/** Where the tools' data comes from: lib/tools once it exists, the snapshot until then, fakes in tests. */
export interface ToolsSource {
  readonly ticker: () => Promise<readonly TickerRow[]>;
  readonly injuries: () => Promise<InjuryReport>;
}

export const snapshotTools: ToolsSource = {
  ticker: async () => TICKER_SAMPLE,
  injuries: async () => ({
    rows: INJURY_SAMPLE,
    clubs: TICKER_SAMPLE.map((row) => row.team.short).sort(),
    asOf: Date.parse(SNAPSHOT_TAKEN_AT),
  }),
};

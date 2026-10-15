// The Players tab (/players): injuries and bans, newest report first, filtered
// by status (?status=) and club (?team=).
import { guard, ready, type Screen } from "./screen";
import type { Query } from "./start";
import { liveTools, type InjuryRow, type InjuryStatus, type ToolsSource } from "./tools";

export type InjuryFilter = "all" | InjuryStatus;
export const INJURY_FILTERS: readonly InjuryFilter[] = ["all", "injured", "doubtful", "suspended", "unavailable"];

/** A long list costs data on mobile; the filters narrow it. */
const SHOWN = 40;

export interface PlayersView {
  readonly status: InjuryFilter;
  /** The club filter, or null for every club. */
  readonly team: string | null;
  readonly clubs: readonly string[];
  /** How many players each status filter would show, within the club filter. */
  readonly counts: Readonly<Record<InjuryFilter, number>>;
  /** At most 40 rows. */
  readonly rows: readonly InjuryRow[];
  /** Report ages are measured from this time (ms). */
  readonly asOf: number;
}

/**
 * "All" means players who could be in a squad: injured, doubtful, suspended.
 * Unavailable (mostly loans and transfers out, about half of FPL's flags) has its own filter.
 */
const shows = (status: InjuryFilter, row: InjuryRow) => (status === "all" ? row.status !== "unavailable" : row.status === status);

export async function loadPlayers(query: Query, source: ToolsSource = liveTools): Promise<Screen<PlayersView>> {
  return guard("players", "/players", async () => {
    const report = await source.injuries();
    const status = INJURY_FILTERS.find((s) => s === query.status) ?? "all";
    const team = report.clubs.find((c) => c === query.team) ?? null;
    const inClub = team === null ? report.rows : report.rows.filter((row) => row.team === team);
    const counts = Object.fromEntries(INJURY_FILTERS.map((s) => [s, inClub.filter((row) => shows(s, row)).length])) as Record<InjuryFilter, number>;
    const rows = inClub.filter((row) => shows(status, row)).slice(0, SHOWN);
    return ready({ status, team, clubs: report.clubs, counts, rows, asOf: report.asOf });
  });
}

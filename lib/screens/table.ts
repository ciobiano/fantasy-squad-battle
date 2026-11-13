// The League tab's Table view: FPL's own standings, like the official app.
// GW points are FPL's event_total (before hits), the same number the official
// table shows; the Market view and cards use the net score.
import type { Standings } from "@/lib/fpl/schemas";
import { firstNameOf } from "@/lib/league/standings";
import { badgeFor, type Badge } from "@/lib/ui/badge";
import { movement, type Movement } from "@/lib/ui/format";

export interface TableRow {
  readonly entry: number;
  readonly pos: number;
  readonly move: Movement;
  readonly firstName: string;
  readonly teamName: string;
  readonly badge: Badge;
  readonly gw: number;
  readonly total: number;
  readonly you: boolean;
}

export interface TableView {
  readonly leagueName: string;
  readonly rows: readonly TableRow[];
  /** True when the league has more than the first 50 managers. */
  readonly truncated: boolean;
}

export function tableView(standings: Standings, youEntry: number | null): TableView {
  return {
    leagueName: standings.league.name.trim(),
    truncated: standings.standings.has_next,
    rows: standings.standings.results.map((row) => ({
      entry: row.entry,
      pos: row.rank,
      // FPL reports last_rank 0 for a manager's first ranked week.
      move: movement(row.rank, row.last_rank > 0 ? row.last_rank : null),
      // The cards' rule (lib/league), so a manager reads the same in both.
      firstName: firstNameOf(row.player_name, row.entry_name),
      teamName: row.entry_name.trim(),
      badge: badgeFor(row.entry_name),
      gw: row.event_total,
      total: row.total,
      you: youEntry !== null && row.entry === youEntry,
    })),
  };
}

const sampleRow = (pos: number, last: number, first: string, team: string, gw: number, total: number, entry: number): TableRow => ({
  entry,
  pos,
  move: movement(pos, last),
  firstName: first,
  teamName: team,
  badge: badgeFor(team),
  gw,
  total,
  you: false,
});

/** The design canvas's sample league after GW 5. */
export const SAMPLE_TABLE: TableView = {
  leagueName: "Ikeja Banter League",
  truncated: false,
  rows: [
    sampleRow(1, 2, "Tobi", "Chop Life FC", 64, 357, 3),
    sampleRow(2, 4, "Kemi", "No Gree For Anybody", 96, 356, 1),
    sampleRow(3, 1, "Femi", "Japa City", 58, 355, 5),
    sampleRow(4, 3, "Yemi", "Cole Palmer Wine", 47, 312, 11),
    sampleRow(5, 5, "Ngozi", "Odogwu XI", 55, 310, 4),
    sampleRow(6, 7, "Seun", "Eze Does It", 52, 302, 6),
    sampleRow(7, 8, "Ibrahim", "Wahala Wanderers", 49, 294, 7),
    sampleRow(8, 6, "Bayo", "Mbeumo Jumbo", 38, 293, 10),
    sampleRow(9, 12, "Amaka", "Jollof United", 71, 292, 2),
    sampleRow(10, 9, "Aïcha", "Les Lions de Douala", 44, 284, 9),
    sampleRow(11, 10, "Emeka", "Agbero Athletic", 45, 277, 8),
    sampleRow(12, 11, "Chidi", "Danfo Rovers", 31, 250, 12),
  ],
};

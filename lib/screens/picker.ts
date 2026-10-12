// The league picker's rows, from getMyTeam (lib/league/my-team.ts).
import type { MyLeague, MyTeam } from "@/lib/league/my-team";
import { compactRank, movement, type Movement } from "@/lib/ui/format";

export interface PickerRow {
  readonly id: number;
  readonly name: string;
  /** "8", "412K", or null before the first ranked gameweek. */
  readonly rank: string | null;
  readonly move: Movement;
  /** Public leagues show the arrow only: a six-digit move says nothing. */
  readonly showPlaces: boolean;
}

export interface PickerView {
  readonly firstName: string;
  readonly teamName: string;
  readonly yours: readonly PickerRow[];
  readonly public: readonly PickerRow[];
}

const toRow = (league: MyLeague): PickerRow => ({
  id: league.id,
  name: league.name,
  rank: league.rank === null ? null : compactRank(league.rank),
  move: movement(league.rank, league.lastRank),
  showPlaces: league.kind === "private",
});

/** Keeps getMyTeam's order: player-made leagues first, smallest first. */
export function pickerView(team: MyTeam): PickerView {
  return {
    firstName: team.firstName,
    teamName: team.teamName,
    yours: team.leagues.filter((l) => l.kind === "private").map(toRow),
    public: team.leagues.filter((l) => l.kind === "public").map(toRow),
  };
}

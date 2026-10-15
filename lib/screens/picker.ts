// The league picker (/team/{id}): every classic league a team is in.
import { fplId } from "@/lib/ids";
import { getMyTeam, type MyLeague, type MyTeam, type MyTeamResult } from "@/lib/league/my-team";
import { badgeFor, type Badge } from "@/lib/ui/badge";
import { compactRank, movement, type Movement } from "@/lib/ui/format";
import { guard, ready, redirectTo, type Screen } from "./screen";
import { startHref } from "./start";

/** Where the picker's data comes from: live FPL, or a fake in tests. */
export interface PickerSource {
  readonly myTeam: (teamId: number) => Promise<MyTeamResult>;
}

export const livePicker: PickerSource = { myTeam: getMyTeam };

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
  readonly badge: Badge;
  /** Player-made leagues, smallest first, so friend groups lead. */
  readonly yours: readonly PickerRow[];
  /** FPL's own leagues (Overall, country, club), folded on screen. */
  readonly public: readonly PickerRow[];
}

const toRow = (league: MyLeague): PickerRow => ({
  id: league.id,
  name: league.name,
  rank: league.rank === null ? null : compactRank(league.rank),
  move: movement(league.rank, league.lastRank),
  showPlaces: league.kind === "private",
});

function pickerView(team: MyTeam): PickerView {
  return {
    firstName: team.firstName,
    teamName: team.teamName,
    badge: badgeFor(team.teamName),
    yours: team.leagues.filter((l) => l.kind === "private").map(toRow),
    public: team.leagues.filter((l) => l.kind === "public").map(toRow),
  };
}

/** A bad or unknown team goes back to Start with the reason; an FPL outage shows the down panel. */
export async function loadPicker(segment: string, source: PickerSource = livePicker): Promise<Screen<PickerView>> {
  const teamId = fplId(segment);
  if (teamId === null) return redirectTo(startHref("team", segment, "not-a-team"));
  return guard("picker", `/team/${teamId}`, async () => {
    const result = await source.myTeam(teamId);
    return result.ok ? ready(pickerView(result.data)) : redirectTo(startHref("team", String(teamId), "team-not-found"));
  });
}

// What the League tab reads for a real league today: FPL's standings (first
// page) and the gameweek to label it with. Data access stays in lib/fpl; this
// only combines the two calls.
import { getStandings } from "@/lib/fpl/api";
import { resolveGameweek } from "@/lib/fpl/league-gameweek";
import type { Standings } from "@/lib/fpl/schemas";

export interface LeagueStandings {
  /** null: no classic league with that ID. */
  readonly standings: Standings | null;
  /** The newest gameweek with unlocked cards, or null before the season starts. */
  readonly gw: number | null;
}

/** Throws when FPL can't be reached; the screen shows the "FPL isn't answering" panel. */
export async function loadLeagueStandings(leagueId: number): Promise<LeagueStandings> {
  const [standings, choice] = await Promise.all([getStandings(leagueId), resolveGameweek(undefined, Date.now())]);
  return { standings, gw: choice.ok ? choice.id : null };
}

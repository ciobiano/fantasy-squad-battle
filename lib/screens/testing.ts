// Test helper: a real league view, computed by the data session's own logic
// (lib/league) from a small league, so screen tests see what production sees.
import type { Standings } from "@/lib/fpl/schemas";
import { buildLeagueView } from "@/lib/league/league-view";
import { makeBundle, player, type TestManager } from "@/lib/league/testing";
import type { LeagueView } from "@/lib/league/types";
import type { LeagueSource } from "./league";

const week = (points: number, hits = 0, bench = 0) => ({ points, hits, bench });

/** Six managers over five gameweeks; Ngozi joined in GW3, Emeka is the visitor. */
const MANAGERS: readonly TestManager[] = [
  { entry: 11, name: "tobi adeyemi", team: "Chop Life FC", weeks: [week(70), week(72), week(68), week(66), week(64)], captain: player(1, "Haaland", 8), vice: player(2, "Saka", 5) },
  { entry: 22, name: "emeka okafor", team: "Agbero Athletic", weeks: [week(50), week(52), week(48), week(60), week(96, 4)], captain: player(3, "Palmer", 13), vice: player(2, "Saka", 5) },
  { entry: 33, name: "kemi bello", team: "No Gree For Anybody", weeks: [week(60), week(58), week(61), week(57), week(55)], captain: player(4, "Fernandes", 2), vice: player(2, "Saka", 5) },
  { entry: 44, name: "bayo ade", team: "Mbeumo Jumbo", weeks: [week(55), week(57), week(59), week(58), week(38, 0, 21)], captain: player(1, "Haaland", 8), vice: player(2, "Saka", 5) },
  { entry: 55, name: "chidi eze", team: "Danfo Rovers", weeks: [week(45), week(47), week(44), week(42), week(39, 8)], captain: player(1, "Haaland", 8), vice: player(2, "Saka", 5) },
  { entry: 66, name: "ngozi obi", team: "Odogwu XI", weeks: [null, null, week(50), week(51), week(52)], captain: player(1, "Haaland", 8), vice: player(2, "Saka", 5) },
];

export function testView(youId?: number): LeagueView {
  const bundle = makeBundle({
    gw: 5,
    managers: MANAGERS,
    dreamTeam: { team: [{ ...player(12, "Brobbey", 17), position: 4 }, { ...player(13, "Rushworth", 11), position: 1 }], top: player(12, "Brobbey", 17) },
  });
  return buildLeagueView({ ...bundle, league: { id: 314, name: " Denizens of Olympus " } }, { youId });
}

export const standingsFor = (view: LeagueView): Standings => ({
  league: { id: view.league.id, name: view.league.name },
  standings: {
    has_next: false,
    page: 1,
    results: view.table.flatMap((row) =>
      row.rank === null
        ? []
        : [{ entry: row.manager.id, entry_name: row.manager.teamName, player_name: row.manager.firstName, rank: row.rank, last_rank: row.lastRank ?? 0, total: row.total ?? 0, event_total: row.gwScore?.points ?? 0 }],
    ),
  },
});

/** A source whose league exists and has a computed gameweek. */
export function liveSource(): LeagueSource {
  return {
    standings: async () => standingsFor(testView()),
    latestGameweek: async () => 5,
    view: async (_id, { youId }) => ({ ok: true, data: testView(youId) }),
  };
}

/** A source for a league that exists but has no gameweek to show yet. */
export const preseasonSource = (): LeagueSource => ({
  ...liveSource(),
  latestGameweek: async () => null,
  view: async () => ({ ok: false, reason: "preseason" }),
});

/** A source with no such league. */
export const missingSource = (): LeagueSource => ({
  standings: async () => null,
  latestGameweek: async () => 5,
  view: async () => ({ ok: false, reason: "league-not-found" }),
});

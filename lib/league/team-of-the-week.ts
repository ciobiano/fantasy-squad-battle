import type { LeagueGameweek } from "@/lib/fpl/league-gameweek";
import type { TeamOfTheWeek, TeamOfTheWeekPlayer } from "./types";

// FPL's official Dream Team, with how many managers in this league own each player.

const POSITIONS: Readonly<Record<number, TeamOfTheWeekPlayer["position"]>> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/** Managers in the league who have each player in their 15-man squad this gameweek. */
function ownership(bundle: LeagueGameweek): Map<number, number> {
  const owners = new Map<number, number>();
  for (const m of bundle.managers) {
    const squad = new Set(m.picks?.picks.map((p) => p.element) ?? []);
    for (const element of squad) owners.set(element, (owners.get(element) ?? 0) + 1);
  }
  return owners;
}

export function teamOfTheWeek(bundle: LeagueGameweek): TeamOfTheWeek {
  const players = new Map(bundle.players.map((p) => [p.id, p]));
  const clubs = new Map(bundle.teams.map((t) => [t.id, t.short_name]));
  const owners = ownership(bundle);
  const nameOf = (id: number) => players.get(id)?.web_name ?? "Unknown";

  const team = [...bundle.dreamTeam.team]
    .sort((a, b) => a.position - b.position)
    .map((slot) => {
      const player = players.get(slot.element);
      return {
        id: slot.element,
        name: nameOf(slot.element),
        club: (player && clubs.get(player.team)) ?? "",
        position: (player && POSITIONS[player.element_type]) ?? "MID",
        points: slot.points,
        ownedBy: owners.get(slot.element) ?? 0,
      };
    });

  const top = bundle.dreamTeam.top_player;
  return { players: team, topPlayer: top ? { name: nameOf(top.id), points: top.points } : null };
}

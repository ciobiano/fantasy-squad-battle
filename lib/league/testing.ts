import type { GameweekStatus } from "@/lib/fpl/gameweek";
import type { BundlePlayer, LeagueGameweek, ManagerGameweek } from "@/lib/fpl/league-gameweek";

// Test helper: builds a LeagueGameweek bundle from a few readable facts, so
// award tests can state exact scores, captains and benches.

export interface TestPlayer {
  readonly id: number;
  readonly name: string;
  readonly points: number;
  readonly minutes?: number;
  readonly position?: 1 | 2 | 3 | 4;
}

export interface TestWeek {
  readonly points: number;
  readonly hits?: number;
  readonly bench?: number;
}

export interface TestManager {
  readonly entry: number;
  /** FPL's player_name, e.g. "tunde bakare". */
  readonly name: string;
  readonly team?: string;
  /** Index 0 is gameweek 1. null: not playing FPL yet that week. */
  readonly weeks: readonly (TestWeek | null)[];
  readonly captain?: TestPlayer;
  readonly vice?: TestPlayer;
  readonly chip?: string | null;
  readonly squad?: readonly TestPlayer[];
  /** Benched players (multiplier 0), in bench order. */
  readonly bench?: readonly TestPlayer[];
}

export const player = (id: number, name: string, points: number, minutes = 90): TestPlayer => ({
  id,
  name,
  points,
  minutes,
});

function history(m: TestManager, gw: number): ManagerGameweek["history"] {
  let total = 0;
  const current = m.weeks.slice(0, gw).flatMap((week, i) => {
    if (!week) return [];
    const hits = week.hits ?? 0;
    total += week.points - hits;
    return [{
      event: i + 1,
      points: week.points,
      total_points: total,
      event_transfers: hits / 4,
      event_transfers_cost: hits,
      points_on_bench: week.bench ?? 0,
      bank: null,
    }];
  });
  return { current, chips: [] };
}

function picks(m: TestManager, gw: number): ManagerGameweek["picks"] {
  const week = m.weeks[gw - 1];
  if (!week) return null;
  const captainMultiplier = m.chip === "3xc" ? 3 : 2;
  const squad = [
    ...(m.captain ? [{ p: m.captain, multiplier: captainMultiplier, is_captain: true, is_vice_captain: false }] : []),
    ...(m.vice ? [{ p: m.vice, multiplier: 1, is_captain: false, is_vice_captain: true }] : []),
    ...(m.squad ?? []).map((p) => ({ p, multiplier: 1, is_captain: false, is_vice_captain: false })),
    ...(m.bench ?? []).map((p) => ({ p, multiplier: 0, is_captain: false, is_vice_captain: false })),
  ];
  const total = history(m, gw).current.at(-1)?.total_points ?? 0;
  return {
    active_chip: m.chip ?? null,
    automatic_subs: [],
    entry_history: {
      event: gw,
      points: week.points,
      total_points: total,
      event_transfers_cost: week.hits ?? 0,
      points_on_bench: week.bench ?? 0,
    },
    picks: squad.map((s, i) => ({
      element: s.p.id,
      position: i + 1,
      multiplier: s.multiplier,
      is_captain: s.is_captain,
      is_vice_captain: s.is_vice_captain,
    })),
  };
}

export function makeBundle(input: {
  readonly gw: number;
  readonly status?: GameweekStatus;
  readonly managers: readonly TestManager[];
  readonly dreamTeam?: { readonly team: readonly TestPlayer[]; readonly top?: TestPlayer };
}): LeagueGameweek {
  const { gw, managers } = input;
  const everyone = [
    ...managers.flatMap((m) => [m.captain, m.vice, ...(m.squad ?? []), ...(m.bench ?? [])]),
    ...(input.dreamTeam?.team ?? []),
    input.dreamTeam?.top,
  ].filter((p): p is TestPlayer => Boolean(p));
  const unique = [...new Map(everyone.map((p) => [p.id, p])).values()];
  const players: BundlePlayer[] = unique.map((p) => ({
    id: p.id,
    web_name: p.name,
    first_name: p.name,
    second_name: "",
    team: 1,
    element_type: p.position ?? 3,
  }));
  return {
    league: { id: 1, name: "Test League" },
    gameweek: { id: gw, status: input.status ?? "final", averageScore: 50 },
    truncated: false,
    managers: managers.map((m) => ({
      entry: m.entry,
      entryName: m.team ?? `${m.name} FC`,
      playerName: m.name,
      history: history(m, gw),
      picks: picks(m, gw),
    })),
    livePoints: Object.fromEntries(unique.map((p) => [p.id, { points: p.points, minutes: p.minutes ?? 90 }])),
    dreamTeam: {
      top_player: input.dreamTeam?.top ? { id: input.dreamTeam.top.id, points: input.dreamTeam.top.points } : null,
      team: (input.dreamTeam?.team ?? []).map((p, i) => ({ element: p.id, points: p.points, position: i + 1 })),
    },
    players,
    teams: [
      {
        id: 1,
        name: "Test United",
        short_name: "TST",
        strength: null,
        strength_attack_home: null,
        strength_attack_away: null,
        strength_defence_home: null,
        strength_defence_away: null,
      },
    ],
  };
}

import { cacheLife, cacheTag } from "next/cache";
import pLimit, { type LimitFunction } from "p-limit";
import {
  getBootstrap,
  getDreamTeam,
  getFixtures,
  getHistory,
  getLive,
  getPicks,
  getStandings,
} from "./api";
import { type GameweekStatus, gameweekStatus, latestUnlockedGameweek } from "./gameweek";
import type { Bootstrap, DreamTeam, Element, History, Live, Picks, Standings, Team } from "./schemas";

// Everything one league needs for one gameweek, in a single cached bundle:
// a warm page load costs one cache lookup instead of ~100 FPL requests.

export const MAX_MANAGERS = 50;
const CONCURRENCY = 6;

type StandingsRow = Standings["standings"]["results"][number];

export interface ManagerGameweek {
  readonly entry: number;
  readonly entryName: string;
  readonly playerName: string;
  readonly history: History;
  /** null when the manager hadn't started playing FPL by this gameweek. */
  readonly picks: Picks | null;
}

export interface LeagueGameweek {
  readonly league: { readonly id: number; readonly name: string };
  readonly gameweek: {
    readonly id: number;
    readonly status: GameweekStatus;
    readonly averageScore: number;
  };
  /** The league has more than MAX_MANAGERS managers; only the top ones are here. */
  readonly truncated: boolean;
  readonly managers: readonly ManagerGameweek[];
  /** This gameweek's points and minutes, for every player referenced below. */
  readonly livePoints: Readonly<Record<number, { readonly points: number; readonly minutes: number }>>;
  readonly dreamTeam: DreamTeam;
  /** Only the players that a manager picked or that made the dream team. */
  readonly players: readonly Element[];
  readonly teams: readonly Team[];
}

export type LeagueGameweekResult =
  | { readonly ok: true; readonly data: LeagueGameweek }
  | { readonly ok: false; readonly reason: "league-not-found" };

export type GameweekChoice =
  | { readonly ok: true; readonly id: number; readonly status: GameweekStatus }
  | { readonly ok: false; readonly reason: "preseason" | "no-such-gameweek" | "not-started" };

/** Picks the gameweek to show: the one asked for, or the newest with unlocked cards. */
export async function resolveGameweek(requested: number | undefined, now: number): Promise<GameweekChoice> {
  const [{ events }, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);
  if (requested === undefined) {
    const latest = latestUnlockedGameweek(events, fixtures, now);
    return latest ? { ok: true, ...latest } : { ok: false, reason: "preseason" };
  }
  const event = events.find((e) => e.id === requested);
  if (!event) return { ok: false, reason: "no-such-gameweek" };
  const status = gameweekStatus(event, fixtures, now);
  return status === "upcoming" ? { ok: false, reason: "not-started" } : { ok: true, id: event.id, status };
}

async function loadManager(
  row: StandingsRow,
  gw: number,
  final: boolean,
  limit: LimitFunction,
): Promise<ManagerGameweek> {
  const [history, picks] = await Promise.all([
    limit(() => getHistory(row.entry, gw, final)),
    limit(() => getPicks(row.entry, gw, final)),
  ]);
  return { entry: row.entry, entryName: row.entry_name, playerName: row.player_name, history, picks };
}

function referencedPlayers(managers: readonly ManagerGameweek[], dreamTeam: DreamTeam): ReadonlySet<number> {
  const picked = managers.flatMap((m) => m.picks?.picks.map((p) => p.element) ?? []);
  const dream = dreamTeam.team.map((p) => p.element);
  return new Set([...picked, ...dream, ...(dreamTeam.top_player ? [dreamTeam.top_player.id] : [])]);
}

function assemble(
  standings: Standings,
  bootstrap: Bootstrap,
  live: Live,
  dreamTeam: DreamTeam,
  managers: readonly ManagerGameweek[],
  gameweek: { readonly id: number; readonly status: GameweekStatus },
): LeagueGameweek {
  const ids = referencedPlayers(managers, dreamTeam);
  const livePoints = Object.fromEntries(
    live.elements
      .filter((e) => ids.has(e.id))
      .map((e) => [e.id, { points: e.stats.total_points, minutes: e.stats.minutes }]),
  );
  const event = bootstrap.events.find((e) => e.id === gameweek.id);
  return {
    league: { id: standings.league.id, name: standings.league.name },
    gameweek: { ...gameweek, averageScore: event?.average_entry_score ?? 0 },
    truncated: standings.standings.has_next || standings.standings.results.length > MAX_MANAGERS,
    managers,
    livePoints,
    dreamTeam,
    players: bootstrap.elements.filter((e) => ids.has(e.id)),
    teams: bootstrap.teams,
  };
}

/**
 * Loads a league's gameweek. An unknown league is a result, not an error (see
 * api.ts on errors and 'use cache'). Any FPL failure throws rather than
 * returning partial data that would hand out the wrong awards.
 */
export async function getLeagueGameweek(
  leagueId: number,
  gw: number,
  status: GameweekStatus,
): Promise<LeagueGameweekResult> {
  "use cache: remote";
  const final = status === "final";
  // Final: still refresh hourly, because league membership can change.
  if (final) cacheLife("hours");
  else cacheLife("provisional");
  cacheTag(`fpl:league:${leagueId}`, `fpl:gw:${gw}`);

  const [bootstrap, standings, live, dreamTeam] = await Promise.all([
    getBootstrap(),
    getStandings(leagueId),
    getLive(gw, final),
    getDreamTeam(gw, final),
  ]);
  if (!standings) return { ok: false, reason: "league-not-found" };

  const limit = pLimit(CONCURRENCY);
  const rows = standings.standings.results.slice(0, MAX_MANAGERS);
  const managers = await Promise.all(rows.map((row) => loadManager(row, gw, final, limit)));
  return { ok: true, data: assemble(standings, bootstrap, live, dreamTeam, managers, { id: gw, status }) };
}

import {
  type GameweekChoice,
  type LeagueGameweek,
  type ManagerGameweek,
  getLeagueGameweek,
  resolveGameweek,
} from "@/lib/fpl/league-gameweek";
import { type Contender, computeAwards } from "./awards";
import { type Timeline, buildTimeline, competitionRanks, historyAt, round1, scoreAt, toManager } from "./standings";
import { teamOfTheWeek } from "./team-of-the-week";
import type { Award, AwardId, CaptainFact, LeagueView, MarketRow, TableRow } from "./types";

// Turns one cached league bundle into everything the league screens and cards
// show. Plain functions, run on every request (D1): the bundle is the single
// source of truth, and pages and card images call this same function.

type ContenderWithSource = Contender & { readonly source: ManagerGameweek };

/** D4: judge the captain the manager chose, reading minutes from live points. */
function captainOf(m: ManagerGameweek, bundle: LeagueGameweek, names: Map<number, string>): CaptainFact | null {
  const picks = m.picks;
  const captain = picks?.picks.find((p) => p.is_captain);
  if (!picks || !captain) return null;
  const vice = picks.picks.find((p) => p.is_vice_captain);
  const live = bundle.livePoints[captain.element];
  const minutes = live?.minutes ?? 0;
  const viceMinutes = vice ? (bundle.livePoints[vice.element]?.minutes ?? 0) : 0;
  return {
    name: names.get(captain.element) ?? "Unknown",
    points: live?.points ?? 0,
    minutes,
    tripleCaptain: picks.active_chip === "3xc",
    viceRescued: minutes === 0 && viceMinutes > 0,
  };
}

function buildContenders(bundle: LeagueGameweek, timeline: Timeline, youId?: number): ContenderWithSource[] {
  const gw = bundle.gameweek.id;
  const names = new Map(bundle.players.map((p) => [p.id, p.web_name]));
  return bundle.managers.map((m) => ({
    source: m,
    manager: toManager(m, youId),
    score: scoreAt(m, gw),
    benchPoints: historyAt(m, gw)?.points_on_bench ?? null,
    captain: captainOf(m, bundle, names),
    rank: timeline.rankAt(m.entry, gw),
    previousRank: gw > 1 ? timeline.rankAt(m.entry, gw - 1) : null,
    recentRanks: [gw - 2, gw - 1, gw].filter((g) => g >= 1).map((g) => timeline.rankAt(m.entry, g)),
  }));
}

const byManagerName = (a: { manager: { firstName: string; id: number } }, b: { manager: { firstName: string; id: number } }) =>
  a.manager.firstName.localeCompare(b.manager.firstName) || a.manager.id - b.manager.id;

const nullsLast = (a: number | null, b: number | null) => (a ?? Infinity) - (b ?? Infinity);

function awardsByManager(awards: readonly Award[]): Map<number, AwardId[]> {
  const map = new Map<number, AwardId[]>();
  for (const a of awards) for (const w of a.winners) map.set(w.manager.id, [...(map.get(w.manager.id) ?? []), a.id]);
  return map;
}

function marketRows(cs: readonly ContenderWithSource[], timeline: Timeline, awards: readonly Award[], gw: number): MarketRow[] {
  const scored = cs.filter((c) => c.score);
  const ranked = competitionRanks(scored, (c) => c.score!.net);
  const gwRanks = new Map(scored.map((c, i) => [c.manager.id, ranked[i]]));
  const won = awardsByManager(awards);
  return cs
    .map((c) => ({
      manager: c.manager,
      score: c.score,
      gwRank: gwRanks.get(c.manager.id) ?? null,
      leagueRank: c.rank,
      leagueRankChange: c.rank !== null && c.previousRank !== null ? c.previousRank - c.rank : null,
      gapSeries: Array.from({ length: gw }, (_, i) => {
        const total = historyAt(c.source, i + 1)?.total_points;
        const average = timeline.averageTotalAt(i + 1);
        return total === undefined || average === null ? null : round1(total - average);
      }),
      awards: won.get(c.manager.id) ?? [],
    }))
    .sort((a, b) => nullsLast(a.gwRank, b.gwRank) || byManagerName(a, b));
}

function tableRows(cs: readonly ContenderWithSource[], gw: number): TableRow[] {
  return cs
    .map((c) => ({
      manager: c.manager,
      rank: c.rank,
      lastRank: c.previousRank,
      movement: c.rank !== null && c.previousRank !== null ? c.previousRank - c.rank : null,
      total: historyAt(c.source, gw)?.total_points ?? null,
      gwScore: c.score,
    }))
    .sort((a, b) => nullsLast(a.rank, b.rank) || byManagerName(a, b));
}

export function buildLeagueView(bundle: LeagueGameweek, options: { readonly youId?: number } = {}): LeagueView {
  const gw = bundle.gameweek.id;
  const timeline = buildTimeline(bundle);
  const contenders = buildContenders(bundle, timeline, options.youId);
  const { awards, skipped } = computeAwards(contenders, gw);
  const nets = contenders.flatMap((c) => (c.score ? [c.score.net] : []));
  return {
    league: bundle.league,
    gameweek: { id: gw, status: bundle.gameweek.status, provisional: bundle.gameweek.status !== "final" },
    truncated: bundle.truncated,
    averages: {
      league: nets.length ? round1(nets.reduce((sum, n) => sum + n, 0) / nets.length) : null,
      fpl: bundle.gameweek.averageScore,
    },
    awards,
    skipped,
    market: marketRows(contenders, timeline, awards, gw),
    table: tableRows(contenders, gw),
    teamOfTheWeek: teamOfTheWeek(bundle),
  };
}

export type LeagueViewResult =
  | { readonly ok: true; readonly data: LeagueView }
  | { readonly ok: false; readonly reason: Extract<GameweekChoice, { ok: false }>["reason"] | "league-not-found" };

/** Loads and builds a league's view: the gameweek asked for, or the newest with unlocked cards. */
export async function getLeagueView(
  leagueId: number,
  options: { readonly gw?: number; readonly now: number; readonly youId?: number },
): Promise<LeagueViewResult> {
  const choice = await resolveGameweek(options.gw, options.now);
  if (!choice.ok) return choice;
  const bundle = await getLeagueGameweek(leagueId, choice.id, choice.status);
  if (!bundle.ok) return bundle;
  return { ok: true, data: buildLeagueView(bundle.data, { youId: options.youId }) };
}

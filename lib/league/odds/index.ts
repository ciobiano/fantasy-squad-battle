import { getBootstrap } from "@/lib/fpl/api";
import { getLeagueGameweek, resolveGameweek, type GameweekChoice, type LeagueGameweek } from "@/lib/fpl/league-gameweek";
import type { Bootstrap } from "@/lib/fpl/schemas";
import { competitionRanks, firstNameOf } from "../standings";
import { outlookOf, type Activity, type Outlook } from "./model";
import { SEASONS, simulateSeason, type Odds } from "./simulate";

// "Tipped to win": each manager's chance of winning the league, finishing in
// the top three and finishing last, from the league bundle the pages already
// load (D1) plus FPL's gameweek averages and player statuses.

export interface ManagerOdds {
  readonly entry: number;
  readonly firstName: string;
  readonly entryName: string;
  /** League rank after the gameweek (1, 2, 2, 4). */
  readonly rank: number;
  readonly total: number;
  /** Chances, 0–1. */
  readonly win: number;
  readonly top3: number;
  readonly last: number;
  /** Change in the chance of winning since the gameweek before, or null in GW1. */
  readonly winChange: number | null;
  readonly activity: Activity;
  readonly idleWeeks: number;
  /** Under 1 in 1,000 to win: out of the race. */
  readonly out: boolean;
}

export interface LeagueOdds {
  readonly league: { readonly id: number; readonly name: string };
  readonly gw: number;
  /** Gameweeks left to play. */
  readonly remaining: number;
  /** Best chance first; ties by league rank. */
  readonly managers: readonly ManagerOdds[];
  /** Only the top 50 managers are in the race (the rest aren't loaded). */
  readonly truncated: boolean;
}

/** Below this chance of winning, a manager is out of the race. */
export const OUT_BELOW = 0.001;

const UNAVAILABLE: ReadonlySet<string> = new Set(["i", "s", "u", "n"]);
const STARTERS = 11;

/** Players who can't play next: injured, suspended or gone, or given no chance. */
function unavailablePlayers(bootstrap: Bootstrap): ReadonlySet<number> {
  return new Set(
    bootstrap.elements
      .filter((e) => (e.status !== null && UNAVAILABLE.has(e.status)) || e.chance_of_playing_next_round === 0)
      .map((e) => e.id),
  );
}

function outlooks(bundle: LeagueGameweek, gw: number, bootstrap: Bootstrap): Outlook[] {
  const averages = new Map(bootstrap.events.map((e) => [e.id, e.average_entry_score]));
  const unavailable = unavailablePlayers(bootstrap);
  return bundle.managers.map((m) =>
    outlookOf({
      entry: m.entry,
      history: m.history,
      gw,
      averages,
      unavailableStarters: (m.picks?.picks ?? []).filter((p) => p.position <= STARTERS && unavailable.has(p.element)).length,
    }),
  );
}

/** The final table decides: leaders, podium and last place share their chance when tied. */
function settled(totals: readonly number[]): Odds[] {
  const ranks = competitionRanks(totals, (t) => t);
  const share = (hit: (rank: number, i: number) => boolean) => {
    const hits = totals.map((_, i) => hit(ranks[i], i));
    const count = hits.filter(Boolean).length;
    return hits.map((h) => (h ? 1 / count : 0));
  };
  const lowest = Math.min(...totals);
  const [win, last] = [share((r) => r === 1), share((_, i) => totals[i] === lowest)];
  return totals.map((_, i) => ({ win: win[i], top3: ranks[i] <= 3 ? 1 : 0, last: last[i] }));
}

function oddsAfter(bundle: LeagueGameweek, gw: number, lastGw: number, bootstrap: Bootstrap): { outlooks: Outlook[]; odds: Odds[] } {
  const list = outlooks(bundle, gw, bootstrap);
  const odds = gw >= lastGw ? settled(list.map((o) => o.total)) : simulateSeason(list, gw, lastGw, `${bundle.league.id}:${gw}`, SEASONS);
  return { outlooks: list, odds };
}

export function buildLeagueOdds(bundle: LeagueGameweek, bootstrap: Bootstrap): LeagueOdds {
  const gw = bundle.gameweek.id;
  const lastGw = Math.max(...bootstrap.events.map((e) => e.id));
  const now = oddsAfter(bundle, gw, lastGw, bootstrap);
  // Last week's odds from the same bundle: histories cut at the week before. The bundle holds only this
  // week's picks, so last week's ghost check reads this week's line-up (it rarely differs).
  const before = gw > 1 ? oddsAfter(bundle, gw - 1, lastGw, bootstrap).odds : null;
  const ranks = competitionRanks(now.outlooks, (o) => o.total);
  const managers = bundle.managers.map((m, i): ManagerOdds => ({
    entry: m.entry,
    firstName: firstNameOf(m.playerName, m.entryName),
    entryName: m.entryName,
    rank: ranks[i],
    total: now.outlooks[i].total,
    ...now.odds[i],
    winChange: before ? now.odds[i].win - before[i].win : null,
    activity: now.outlooks[i].activity,
    idleWeeks: now.outlooks[i].idleWeeks,
    out: now.odds[i].win < OUT_BELOW,
  }));
  return {
    league: bundle.league,
    gw,
    remaining: lastGw - gw,
    managers: [...managers].sort((a, b) => b.win - a.win || a.rank - b.rank),
    truncated: bundle.truncated,
  };
}

export type LeagueOddsResult =
  | { readonly ok: true; readonly data: LeagueOdds }
  | { readonly ok: false; readonly reason: Extract<GameweekChoice, { ok: false }>["reason"] | "league-not-found" };

/** Odds after the gameweek asked for, or the newest with unlocked cards. */
export async function getLeagueOdds(leagueId: number, options: { readonly gw?: number; readonly now: number }): Promise<LeagueOddsResult> {
  const choice = await resolveGameweek(options.gw, options.now);
  if (!choice.ok) return choice;
  const [bundle, bootstrap] = await Promise.all([getLeagueGameweek(leagueId, choice.id, choice.status), getBootstrap()]);
  if (!bundle.ok) return bundle;
  return { ok: true, data: buildLeagueOdds(bundle.data, bootstrap) };
}

export type { Activity } from "./model";

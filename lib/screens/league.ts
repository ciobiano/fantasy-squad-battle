// The League tab (/league/{id} for the Market, /league/{id}/table for the
// Table), for a real league or the design canvas's sample league.
import { getStandings } from "@/lib/fpl/api";
import { resolveGameweek } from "@/lib/fpl/league-gameweek";
import type { Standings } from "@/lib/fpl/schemas";
import { SAMPLE_LEAGUE, fplId } from "@/lib/ids";
import { getLeagueView, type LeagueViewResult } from "@/lib/league/league-view";
import { marketFromView } from "./from-view";
import { SAMPLE_MARKET, marketView, type MarketView } from "./market";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";
import { startHref } from "./start";
import { SAMPLE_TABLE, tableView, type TableView } from "./table";

/** Where a real league's data comes from: live FPL, or a fake in tests. */
export interface LeagueSource {
  /** First page of standings; null when there's no classic league with that ID. */
  readonly standings: (leagueId: number) => Promise<Standings | null>;
  /** The newest gameweek with unlocked cards; null before the season starts. */
  readonly latestGameweek: () => Promise<number | null>;
  /**
   * The league's computed gameweek (lib/league): awards, Market, Table, Team of
   * the Week. The newest unlocked gameweek unless one is asked for; `youId` marks
   * the visitor's row. Slower than standings when cold (one FPL read per manager).
   */
  readonly view: (leagueId: number, options: { readonly gw?: number; readonly youId?: number }) => Promise<LeagueViewResult>;
}

export const liveLeague: LeagueSource = {
  standings: getStandings,
  latestGameweek: async () => {
    const choice = await resolveGameweek(undefined, Date.now());
    return choice.ok ? choice.id : null;
  },
  view: (leagueId, { gw, youId }) => getLeagueView(leagueId, { gw, youId, now: Date.now() }),
};

export type LeagueTab = "market" | "table";

export interface LeagueView {
  /** A number, or "sample". */
  readonly leagueId: string;
  readonly leagueName: string;
  readonly tab: LeagueTab;
  readonly gw: number | null;
  /** "Change league": the remembered team's picker, or Start. */
  readonly changeHref: string;
  readonly body:
    | { readonly kind: "market"; readonly market: MarketView }
    /** No awards to show yet (before the season's first unlocked gameweek): a note and a link to the Table. */
    | { readonly kind: "market-soon" }
    | { readonly kind: "table"; readonly table: TableView };
}

const changeHrefFor = (team: number | null) => (team !== null ? `/team/${team}` : "/?start=1&mode=league");

function sampleLeague(tab: LeagueTab, changeHref: string): LeagueView {
  const body: LeagueView["body"] =
    tab === "market" ? { kind: "market", market: marketView(SAMPLE_MARKET) } : { kind: "table", table: SAMPLE_TABLE };
  return { leagueId: SAMPLE_LEAGUE, leagueName: SAMPLE_MARKET.leagueName, tab, gw: SAMPLE_MARKET.gw, changeHref, body };
}

/**
 * A league's Market or Table. `team` is the remembered team, highlighted in
 * the Table. An unknown league goes back to Start with the reason.
 */
export async function loadLeague(
  segment: string,
  tab: LeagueTab,
  team: number | null,
  source: LeagueSource = liveLeague,
): Promise<Screen<LeagueView>> {
  const changeHref = changeHrefFor(team);
  if (segment === SAMPLE_LEAGUE) return ready(sampleLeague(tab, changeHref));
  const leagueId = fplId(segment);
  if (leagueId === null) return notFound();

  const retry = tab === "table" ? `/league/${leagueId}/table` : `/league/${leagueId}`;
  const unknownLeague = () => redirectTo<LeagueView>(startHref("league", String(leagueId), "league-not-found"));
  return guard("league", retry, async () => {
    if (tab === "market") {
      const result = await source.view(leagueId, { youId: team ?? undefined });
      if (result.ok) {
        const market = marketFromView(result.data);
        return ready({ leagueId: String(leagueId), leagueName: market.leagueName, tab, gw: market.gw, changeHref, body: { kind: "market", market: marketView(market) } });
      }
      if (result.reason === "league-not-found") return unknownLeague();
    }
    // The Table, or a Market with no gameweek to show yet: FPL's standings.
    const [standings, gw] = await Promise.all([source.standings(leagueId), source.latestGameweek()]);
    if (standings === null) return unknownLeague();
    const table = tableView(standings, team);
    const body: LeagueView["body"] = tab === "table" ? { kind: "table", table } : { kind: "market-soon" };
    return ready({ leagueId: String(leagueId), leagueName: table.leagueName, tab, gw, changeHref, body });
  });
}

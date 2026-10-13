// The League tab (/league/{id} for the Market, /league/{id}/table for the
// Table), for a real league or the design canvas's sample league.
import { getStandings } from "@/lib/fpl/api";
import { resolveGameweek } from "@/lib/fpl/league-gameweek";
import type { Standings } from "@/lib/fpl/schemas";
import { SAMPLE_LEAGUE, fplId } from "@/lib/ids";
import { SAMPLE_MARKET, marketView, type MarketData, type MarketView } from "./market";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";
import { startHref } from "./start";
import { SAMPLE_TABLE, tableView, type TableView } from "./table";

/** Where a real league's data comes from: live FPL, or a fake in tests. */
export interface LeagueSource {
  /** First page of standings; null when there's no classic league with that ID. */
  readonly standings: (leagueId: number) => Promise<Standings | null>;
  /** The newest gameweek with unlocked cards; null before the season starts. */
  readonly latestGameweek: () => Promise<number | null>;
  /** The Market and its awards; null until the award logic (lib/league) is wired in. */
  readonly market: (leagueId: number) => Promise<MarketData | null>;
}

export const liveLeague: LeagueSource = {
  standings: getStandings,
  latestGameweek: async () => {
    const choice = await resolveGameweek(undefined, Date.now());
    return choice.ok ? choice.id : null;
  },
  market: async () => null,
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
    /** A real league before lib/league lands: a note and a link to the Table. */
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
  return guard("league", retry, async () => {
    const [standings, gw, market] = await Promise.all([
      source.standings(leagueId),
      source.latestGameweek(),
      tab === "market" ? source.market(leagueId) : null,
    ]);
    if (standings === null) return redirectTo(startHref("league", String(leagueId), "league-not-found"));
    const table = tableView(standings, team);
    const body: LeagueView["body"] =
      tab === "table" ? { kind: "table", table } : market ? { kind: "market", market: marketView(market) } : { kind: "market-soon" };
    return ready({ leagueId: String(leagueId), leagueName: table.leagueName, tab, gw, changeHref, body });
  });
}

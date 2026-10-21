// League · On paper (/league/{id}/paper): every squad in the league rated over
// the coming gameweeks and ranked, beside its real table position. The banter
// line under the header: who has the best squad, and who tops the table with what.
import { getStandings } from "@/lib/fpl/api";
import type { Standings } from "@/lib/fpl/schemas";
import { SAMPLE_LEAGUE, fplId } from "@/lib/ids";
import { getLeaguePaper, type PaperTable } from "@/lib/planner/league";
import { badgeFor, type Badge } from "@/lib/ui/badge";
import { changeHrefFor, type LeagueView } from "./league";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";
import { startHref } from "./start";

export interface PaperSource {
  readonly paper: (leagueId: number) => Promise<PaperTable>;
  /** Only for the league's name when nobody has a squad yet. */
  readonly standings: (leagueId: number) => Promise<Standings | null>;
}

export const livePaper: PaperSource = { paper: (leagueId) => getLeaguePaper(leagueId), standings: getStandings };

export interface PaperRowView {
  readonly entry: number;
  /** Rank on paper; equal ratings share a rank. */
  readonly rank: number;
  readonly firstName: string;
  readonly teamName: string;
  readonly badge: Badge;
  /** Expected points over the window: best eleven and captain each week, no transfers. */
  readonly points: number;
  /** Position in the real league table. */
  readonly leagueRank: number;
  readonly you: boolean;
}

export interface PaperView {
  readonly firstGw: number;
  readonly lastGw: number;
  readonly truncated: boolean;
  readonly rows: readonly PaperRowView[];
  /** The best squad on paper, and the table leader with his rank on paper (the same person or not). */
  readonly headline: { readonly best: string; readonly leader: string; readonly leaderRank: number } | null;
}

function paperView(table: Extract<PaperTable, { kind: "ready" }>, team: number | null): PaperView {
  const rows = table.rows.map((r) => ({
    entry: r.entry,
    rank: r.rank,
    firstName: r.firstName,
    teamName: r.entryName.trim(),
    badge: badgeFor(r.entryName),
    points: r.rating.points,
    leagueRank: r.leagueRank,
    you: r.entry === team,
  }));
  const best = rows.find((r) => r.rank === 1);
  const leader = rows.find((r) => r.leagueRank === 1);
  return {
    firstGw: table.gws[0] ?? 0,
    lastGw: table.gws.at(-1) ?? 0,
    truncated: table.truncated,
    rows,
    headline: best && leader ? { best: best.firstName, leader: leader.firstName, leaderRank: leader.rank } : null,
  };
}

/** On paper for a real league. The sample league has no squads, so it opens its Market instead. */
export async function loadLeaguePaper(segment: string, team: number | null, source: PaperSource = livePaper): Promise<Screen<LeagueView>> {
  if (segment === SAMPLE_LEAGUE) return redirectTo(`/league/${SAMPLE_LEAGUE}`);
  const leagueId = fplId(segment);
  if (leagueId === null) return notFound();
  const base = { leagueId: String(leagueId), tab: "paper" as const, changeHref: changeHrefFor(team) };
  return guard("league", `/league/${leagueId}/paper`, async () => {
    const table = await source.paper(leagueId);
    if (table.kind === "league-not-found") return redirectTo<LeagueView>(startHref("league", String(leagueId), "league-not-found"));
    if (table.kind === "no-squads") {
      const standings = await source.standings(leagueId);
      if (standings === null) return redirectTo<LeagueView>(startHref("league", String(leagueId), "league-not-found"));
      return ready({ ...base, leagueName: standings.league.name.trim(), gw: null, body: { kind: "paper-soon" } });
    }
    return ready({ ...base, leagueName: table.league.name.trim(), gw: table.asOf, body: { kind: "paper", paper: paperView(table, team) } });
  });
}

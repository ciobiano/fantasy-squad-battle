import pLimit from "p-limit";
import { getBootstrap, getFixtures, getPicks, getStandings } from "@/lib/fpl/api";
import { MAX_MANAGERS } from "@/lib/fpl/league-gameweek";
import type { Bootstrap, Fixture, Picks, Standings } from "@/lib/fpl/schemas";
import type { MyLeague } from "@/lib/league/my-team";
import { firstNameOf } from "@/lib/league/standings";
import { buildProjections, PROJECTION_WEEKS } from "@/lib/projections";
import { rankSquads, type SquadRating } from "./engine/rating";
import { contextOf } from "./index";
import { plannerPlayers } from "./players";
import { rulesOf } from "./rules";

// "On paper": every squad in a mini-league rated over the coming gameweeks
// and ranked, as of the last deadline. Our banter twist on FFS's team rating:
// who has the best team on paper, and who is relying on prayers.

export interface PaperRow {
  readonly entry: number;
  readonly entryName: string;
  readonly firstName: string;
  /** Rank on paper: by rating, equal ratings share a rank. */
  readonly rank: number;
  /** Rank in the real league table. */
  readonly leagueRank: number;
  readonly rating: SquadRating;
}

export type PaperTable =
  | {
      readonly kind: "ready";
      readonly league: { readonly id: number; readonly name: string };
      /** Squads as of this gameweek's deadline. */
      readonly asOf: number;
      readonly gws: readonly number[];
      /** Only the top MAX_MANAGERS managers are rated. */
      readonly truncated: boolean;
      readonly rows: readonly PaperRow[];
    }
  | { readonly kind: "league-not-found" }
  /** Before the first deadline, nobody has a squad to rate. */
  | { readonly kind: "no-squads" };

export interface PaperSource {
  readonly bootstrap: () => Promise<Bootstrap>;
  readonly fixtures: () => Promise<readonly Fixture[]>;
  readonly standings: (leagueId: number) => Promise<Standings | null>;
  /** `final`: the gameweek is finished, so its picks can be cached for good. */
  readonly picks: (entryId: number, gw: number, final: boolean) => Promise<Picks | null>;
}

export const livePaper: PaperSource = {
  bootstrap: getBootstrap,
  fixtures: getFixtures,
  standings: getStandings,
  picks: getPicks,
};

const CONCURRENCY = 6;

/** The squad that carries on after `gw`: the one before a Free Hit, which lasts one week. */
async function squadAfter(entry: number, gw: number, finished: ReadonlySet<number>, source: PaperSource): Promise<number[] | null> {
  const picks = await source.picks(entry, gw, finished.has(gw));
  if (!picks) return null;
  if (picks.active_chip !== "freehit") return picks.picks.map((p) => p.element);
  const before = await source.picks(entry, gw - 1, finished.has(gw - 1));
  return (before ?? picks).picks.map((p) => p.element);
}

/**
 * The leagues a team can be ranked in on paper: started, with more than one
 * manager, and the team among the top MAX_MANAGERS that are loaded. Keeps the
 * order it's given (getMyTeam puts friend leagues first, smallest first).
 */
export function paperLeagues(leagues: readonly MyLeague[]): MyLeague[] {
  return leagues.filter(
    (l) => l.members !== null && l.members > 1 && (l.members <= MAX_MANAGERS || (l.rank !== null && l.rank <= MAX_MANAGERS)),
  );
}

export async function getLeaguePaper(leagueId: number, weeks = PROJECTION_WEEKS, source: PaperSource = livePaper): Promise<PaperTable> {
  const [bootstrap, fixtures, standings] = await Promise.all([source.bootstrap(), source.fixtures(), source.standings(leagueId)]);
  if (!standings) return { kind: "league-not-found" };
  const current = bootstrap.events.find((e) => e.is_current)?.id;
  if (current === undefined) return { kind: "no-squads" };

  const rows = standings.standings.results.slice(0, MAX_MANAGERS);
  const limit = pLimit(CONCURRENCY);
  // Once FPL marks a gameweek finished its picks never change, so they're cached for good: switching
  // between leagues stays quick. While it's live, automatic substitutions still change them.
  const finished = new Set(bootstrap.events.filter((e) => e.finished).map((e) => e.id));
  const squads = await Promise.all(rows.map((row) => limit(() => squadAfter(row.entry, current, finished, source))));
  const entries = rows.flatMap((row, i) => {
    const squad = squads[i];
    return squad ? [{ squad, entry: row.entry, entryName: row.entry_name, firstName: firstNameOf(row.player_name, row.entry_name), leagueRank: row.rank }] : [];
  });
  if (!entries.length) return { kind: "no-squads" };

  const projections = buildProjections(bootstrap, fixtures, weeks);
  const owned = new Set(entries.flatMap((e) => e.squad));
  const ctx = contextOf({ gws: projections.gws, rules: rulesOf(bootstrap), players: plannerPlayers(bootstrap, projections, owned) });
  return {
    kind: "ready",
    league: { id: standings.league.id, name: standings.league.name },
    asOf: current,
    gws: projections.gws,
    truncated: standings.standings.has_next || standings.standings.results.length > MAX_MANAGERS,
    rows: rankSquads(entries, ctx).map(({ entry, entryName, firstName, leagueRank, rank, rating }) => ({ entry, entryName, firstName, leagueRank, rank, rating })),
  };
}

import { getEntry } from "@/lib/fpl/api";
import type { Entry } from "@/lib/fpl/schemas";

// "Find my leagues": a team ID becomes the list of leagues to pick from on
// the Start screen. Any league member can use it, not just the owner.

export interface MyLeague {
  readonly id: number;
  readonly name: string;
  /**
   * "private": made by players. Usually friend groups, but some are huge
   * (one had 155,892 members), so the picker also sorts by size.
   * "public": FPL's own leagues (Overall, countries, clubs, gameweek leagues).
   */
  readonly kind: "private" | "public";
  /** Managers in the league; null before the league has started. */
  readonly members: number | null;
  /** This manager's rank; null before their first ranked gameweek in it. */
  readonly rank: number | null;
  readonly lastRank: number | null;
}

export interface MyTeam {
  readonly id: number;
  /** First name only: surnames are never read or shown. */
  readonly firstName: string;
  readonly teamName: string;
  readonly leagues: readonly MyLeague[];
}

export type MyTeamResult =
  | { readonly ok: true; readonly data: MyTeam }
  | { readonly ok: false; readonly reason: "team-not-found" };

type ClassicLeague = Entry["leagues"]["classic"][number];

const rankOrNull = (rank: number | null) => (rank !== null && rank > 0 ? rank : null);

function toLeague(league: ClassicLeague): MyLeague {
  return {
    id: league.id,
    name: league.name.trim(),
    kind: league.league_type === "s" ? "public" : "private",
    members: league.rank_count,
    rank: rankOrNull(league.entry_rank),
    lastRank: rankOrNull(league.entry_last_rank),
  };
}

/** Player-made leagues first, then FPL's own; smallest first within each, so friend groups lead. */
function pickerOrder(a: MyLeague, b: MyLeague): number {
  if (a.kind !== b.kind) return a.kind === "private" ? -1 : 1;
  const bySize = (a.members ?? Infinity) - (b.members ?? Infinity);
  return Number.isNaN(bySize) || bySize === 0 ? a.name.localeCompare(b.name) : bySize;
}

export function toMyTeam(entry: Entry): MyTeam {
  return {
    id: entry.id,
    firstName: entry.player_first_name.trim(),
    teamName: entry.name.trim(),
    leagues: entry.leagues.classic.map(toLeague).sort(pickerOrder),
  };
}

export async function getMyTeam(teamId: number): Promise<MyTeamResult> {
  const entry = await getEntry(teamId);
  return entry ? { ok: true, data: toMyTeam(entry) } : { ok: false, reason: "team-not-found" };
}

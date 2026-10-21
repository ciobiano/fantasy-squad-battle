// The Planner tab before the plan itself: Start (/planner, no team yet), the
// Start form's target (/planner/find), a team's rating (/planner/{id}), and
// where that team stands "on paper" in the remembered league.
import { parseStartInput } from "@/lib/fpl/start-input";
import { START_ERRORS, type StartError } from "@/lib/i18n";
import { fplId } from "@/lib/ids";
import { getPlanner, type PlannerData, type PlannerOutcome } from "@/lib/planner";
import type { Position } from "@/lib/planner/engine";
import { getLeaguePaper, type PaperTable } from "@/lib/planner/league";
import { badgeFor, type Badge } from "@/lib/ui/badge";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";
import type { Query } from "./start";

/** Where the planner's data comes from: live FPL, or fakes in tests. */
export interface PlannerScreenSource {
  readonly planner: (teamId: number | null) => Promise<PlannerOutcome>;
  readonly paper: (leagueId: number) => Promise<PaperTable>;
}

export const livePlannerScreens: PlannerScreenSource = {
  planner: (teamId) => getPlanner(teamId),
  paper: (leagueId) => getLeaguePaper(leagueId),
};

// ---------------------------------------------------------------- Start

export interface PlannerStartView {
  /** What was typed, kept so a mistake can be fixed rather than retyped. */
  readonly value: string;
  readonly error: StartError | null;
}

const MAX_TYPED = 300;

const one = (query: Query, key: string): string => {
  const value = query[key];
  return ((typeof value === "string" ? value : value?.[0]) ?? "").slice(0, MAX_TYPED);
};

/** Back to the Planner's Start with what was typed and why it didn't work (?start=1 keeps a remembered team from opening). */
export const plannerStartHref = (typed: string, error: StartError): string =>
  `/planner?${new URLSearchParams({ start: "1", q: typed.slice(0, MAX_TYPED), error })}`;

export function plannerStartView(query: Query): PlannerStartView {
  return { value: one(query, "q"), error: START_ERRORS.find((e) => e === one(query, "error")) ?? null };
}

/** Where the Start form goes: the team's rating, or back to Start with the reason. A league link isn't a team. */
export function plannerDestination(query: Query): string {
  const typed = one(query, "q");
  const input = parseStartInput(typed, "team");
  if (!input.ok) return plannerStartHref(typed, input.error);
  return input.kind === "team" ? `/planner/${input.teamId}` : plannerStartHref(typed, "not-a-team");
}

// ---------------------------------------------------------------- Your team

export type RatingPart = Position | "captain";

export interface TransferIdeaView {
  readonly moves: readonly { readonly out: string; readonly in: string }[];
  /** Points for the team over the window, after any hit. */
  readonly gain: number;
  /** Points the hit costs (0 when the transfers are free). */
  readonly hit: number;
  /** Money left after the moves, in tenths of a million. */
  readonly bank: number;
}

export interface RatedTeamView {
  readonly kind: "rated";
  readonly team: { readonly id: number; readonly name: string; readonly badge: Badge };
  /** The squad is as of this gameweek's deadline. */
  readonly asOf: number;
  readonly firstGw: number;
  readonly lastGw: number;
  /** Expected points over the window: best eleven and captain each week, no transfers. */
  readonly points: number;
  readonly weeks: readonly { readonly gw: number; readonly points: number }[];
  /** The four positions and the armband: they add up to `points`. `share` is against the biggest part. */
  readonly parts: readonly { readonly key: RatingPart; readonly points: number; readonly share: number }[];
  readonly singles: readonly TransferIdeaView[];
  readonly pairs: readonly TransferIdeaView[];
}

/** The team hasn't played a gameweek yet, so FPL shows no squad. */
export interface NoSquadView {
  readonly kind: "no-squad";
  readonly team: { readonly id: number; readonly name: string; readonly badge: Badge };
  /** When FPL will show the squad (the next deadline, ISO), if known. */
  readonly deadline: string | null;
}

export type TeamRatingView = RatedTeamView | NoSquadView;

const POSITIONS: readonly Position[] = ["GK", "DEF", "MID", "FWD"];

function ratedView(data: PlannerData): RatedTeamView | null {
  const { team, players, rules, gws } = data;
  if (!team || gws.length === 0) return null;
  const nameOf = new Map(players.map((p) => [p.id, p.name]));
  const idea = (moves: readonly { readonly out: number; readonly in: number }[], gain: number, bank: number): TransferIdeaView => ({
    moves: moves.map((m) => ({ out: nameOf.get(m.out) ?? "", in: nameOf.get(m.in) ?? "" })),
    gain,
    hit: Math.max(0, moves.length - team.start.freeTransfers) * rules.hitCost,
    bank,
  });
  const values: readonly (readonly [RatingPart, number])[] = [
    ...POSITIONS.map((p) => [p, team.rating.byPosition[p]] as const),
    ["captain", team.rating.captaincy],
  ];
  const biggest = Math.max(...values.map(([, v]) => v), 1);
  return {
    kind: "rated",
    team: { id: team.id, name: team.name.trim(), badge: badgeFor(team.name) },
    asOf: team.asOf,
    firstGw: gws[0],
    lastGw: gws[gws.length - 1],
    points: team.rating.points,
    weeks: gws.map((gw, i) => ({ gw, points: team.rating.perWeek[i] ?? 0 })),
    parts: values.map(([key, points]) => ({ key, points, share: points / biggest })),
    singles: team.ideas.singles.slice(0, 3).map((i) => idea(i.transfers, i.gain, i.bank)),
    pairs: team.ideas.pairs.slice(0, 1).map((i) => idea(i.transfers, i.gain, i.bank)),
  };
}

/** A team's rating. An unknown team goes back to Start with the reason; an FPL outage is the "down" panel. */
export async function loadTeamRating(segment: string, source: PlannerScreenSource = livePlannerScreens): Promise<Screen<TeamRatingView>> {
  const teamId = fplId(segment);
  if (teamId === null) return notFound();
  return guard("planner", `/planner/${teamId}`, async () => {
    const outcome = await source.planner(teamId);
    if (outcome.kind === "team-not-found") return redirectTo(plannerStartHref(String(teamId), "team-not-found"));
    if (outcome.kind === "no-squad") {
      const { team, deadline } = outcome;
      return ready({ kind: "no-squad", team: { id: team.id, name: team.name.trim(), badge: badgeFor(team.name) }, deadline });
    }
    const view = ratedView(outcome.data);
    if (view) return ready(view);
    // A squad with no gameweeks left to plan: the season is over.
    return ready({ kind: "no-squad", team: { id: teamId, name: outcome.data.team?.name.trim() ?? "", badge: badgeFor(outcome.data.team?.name ?? "") }, deadline: null });
  });
}

// ---------------------------------------------------------------- On paper, for the rating screen

export interface PaperRankView {
  readonly rank: number;
  readonly of: number;
  readonly leagueName: string;
  readonly href: string;
}

/**
 * Where a team stands on paper in a league, or null when there's no league,
 * the team isn't in it, or it can't be worked out. A garnish: it never fails the page.
 */
export async function loadPaperRank(leagueId: number | null, teamId: number, source: PlannerScreenSource = livePlannerScreens): Promise<PaperRankView | null> {
  if (leagueId === null) return null;
  try {
    const table = await source.paper(leagueId);
    if (table.kind !== "ready") return null;
    const row = table.rows.find((r) => r.entry === teamId);
    return row ? { rank: row.rank, of: table.rows.length, leagueName: table.league.name.trim(), href: `/league/${leagueId}/paper` } : null;
  } catch (failure) {
    console.error("[planner] on paper failed", { leagueId, failure });
    return null;
  }
}

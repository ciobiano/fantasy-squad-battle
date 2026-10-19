import { getBootstrap, getFixtures } from "@/lib/fpl/api";
import type { Bootstrap, Fixture } from "@/lib/fpl/schemas";
import { buildProjections, PROJECTION_WEEKS } from "@/lib/projections";
import type { TeamOutlook } from "@/lib/projections/types";
import { rateSquad, type SquadRating } from "./engine/rating";
import type { Context } from "./engine/simulate";
import { suggestPairs, suggestTransfers, type TransferIdea } from "./engine/suggest";
import type { Rules, Start } from "./engine/types";
import { importSquad, liveImport, type ImportSource, type SquadImport } from "./import";
import { plannerPlayers, type PlannerPlayer } from "./players";
import { rulesOf } from "./rules";

// Everything the planner and the team rating need, in one serialisable bundle:
// the rules, every player with our projections, each club's matches, and,
// given a team ID, that manager's squad with its rating and transfer ideas.
// The screen draws the rating from the server; the planner's edits run in the
// browser through lib/planner/engine, on this same data.

export interface PlannerData {
  /** The gameweeks planned, from the next deadline. */
  readonly gws: readonly number[];
  /** The next deadline (ISO), or null once the season is over. */
  readonly deadline: string | null;
  readonly rules: Rules;
  readonly players: readonly PlannerPlayer[];
  readonly clubs: readonly { readonly id: number; readonly name: string; readonly short: string }[];
  /** Each club's matches over the window, with goals and clean-sheet chances (our version of FFS's FDR+). */
  readonly outlook: readonly TeamOutlook[];
  /** The imported squad, or null when planning from scratch. */
  readonly team: TeamPlan | null;
}

export interface TeamPlan {
  readonly id: number;
  readonly name: string;
  /** The squad is as of this gameweek's deadline. */
  readonly asOf: number;
  readonly start: Start;
  /** Players whose price paid is a guess, so their selling price is too. */
  readonly guessedPrices: readonly number[];
  readonly rating: SquadRating;
  readonly ideas: { readonly singles: readonly TransferIdea[]; readonly pairs: readonly TransferIdea[] };
}

export type PlannerOutcome =
  | { readonly kind: "ready"; readonly data: PlannerData }
  | Exclude<SquadImport, { kind: "ready" }>;

export interface PlannerSource {
  readonly bootstrap: () => Promise<Bootstrap>;
  readonly fixtures: () => Promise<readonly Fixture[]>;
  readonly squads: ImportSource;
}

export const livePlanner: PlannerSource = { bootstrap: getBootstrap, fixtures: getFixtures, squads: liveImport };

/** The engine's context for a bundle. */
export const contextOf = (data: Pick<PlannerData, "players" | "gws" | "rules">): Context => ({
  players: new Map(data.players.map((p) => [p.id, p])),
  gws: data.gws,
  rules: data.rules,
});

/**
 * The planner bundle, from scratch (teamId null) or with a manager's squad.
 * Expected outcomes (no such team, no squad yet) are values; an FPL outage throws.
 */
export async function getPlanner(teamId: number | null, weeks = PROJECTION_WEEKS, source: PlannerSource = livePlanner): Promise<PlannerOutcome> {
  const [bootstrap, fixtures] = await Promise.all([source.bootstrap(), source.fixtures()]);
  const rules = rulesOf(bootstrap);
  const imported = teamId === null ? null : await importSquad(teamId, bootstrap, rules, source.squads);
  if (imported && imported.kind !== "ready") return imported;

  const projections = buildProjections(bootstrap, fixtures, weeks);
  const owned = new Set(imported?.start.squad.map((o) => o.id) ?? []);
  const players = plannerPlayers(bootstrap, projections, owned);
  const base = { gws: projections.gws, rules, players };
  const ctx = contextOf(base);
  const next = bootstrap.events.find((e) => e.is_next);

  const team: TeamPlan | null = imported && {
    id: imported.team.id,
    name: imported.team.name,
    asOf: imported.asOf,
    start: imported.start,
    guessedPrices: imported.guessedPrices,
    rating: rateSquad([...owned], ctx),
    ideas: { singles: suggestTransfers(imported.start, ctx, 5), pairs: suggestPairs(imported.start, ctx, 3) },
  };
  return {
    kind: "ready",
    data: {
      ...base,
      deadline: next?.deadline_time ?? null,
      clubs: bootstrap.teams.map((t) => ({ id: t.id, name: t.name, short: t.short_name })),
      outlook: projections.teams,
      team,
    },
  };
}

export type { PlannerPlayer, PriceTrend } from "./players";

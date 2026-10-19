import { getBootstrap, getFixtures } from "@/lib/fpl/api";
import type { Bootstrap, Fixture } from "@/lib/fpl/schemas";
import { tickerGameweeks } from "@/lib/tools/ticker";
import { projectPlayers } from "./players";
import { scoringOf } from "./scoring";
import { matchesPlayed, teamOutlooks, teamStrengths } from "./teams";
import type { Projections } from "./types";

// Our projections from the next deadline, built per request from the cached
// bootstrap and fixtures, like the ticker (D1). Pure apart from getProjections.

/** The planner and the team rating look six gameweeks ahead by default, like the ticker. */
export const PROJECTION_WEEKS = 6;

export function buildProjections(bootstrap: Bootstrap, fixtures: readonly Fixture[], weeks = PROJECTION_WEEKS): Projections {
  const gws = tickerGameweeks(bootstrap.events, weeks);
  const deadlineOf = new Map(bootstrap.events.map((e) => [e.id, Date.parse(e.deadline_time)]));
  const strengths = teamStrengths(bootstrap, fixtures);
  const teams = teamOutlooks(strengths, fixtures, gws);
  const deadlines = gws.map((gw) => deadlineOf.get(gw) ?? Infinity);
  const players = projectPlayers(bootstrap, strengths, teams, deadlines, matchesPlayed(fixtures), scoringOf(bootstrap));
  return { gws, teams, players };
}

/** Projections from live FPL data. Throws when FPL can't be read (the screen shows its outage panel). */
export async function getProjections(weeks = PROJECTION_WEEKS): Promise<Projections> {
  const [bootstrap, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);
  return buildProjections(bootstrap, fixtures, weeks);
}

export type { MatchOutlook, PlayerProjection, Position, Projections, TeamOutlook, TeamStrength } from "./types";

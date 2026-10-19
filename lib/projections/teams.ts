import type { Bootstrap, Fixture } from "@/lib/fpl/schemas";
import type { MatchOutlook, TeamOutlook, TeamStrength } from "./types";

// Club strength and match outlook. FPL's own team strength fields are all 0 in
// 2026/27 (checked 19 Oct), so strength comes from expected goals instead:
// attack is the xG a club's players have created per match, defence the xG its
// goalkeepers have faced. Both lean on the league average until a club has a
// few matches behind it.

/** Matches of league-average form blended into every club, so early-season numbers don't swing wildly. */
export const PRIOR_MATCHES = 5;

/** Goals per team per match when nothing has been played yet (the Premier League's long-run average). */
export const FALLBACK_GOALS = 1.4;

/** Playing at home lifts goals by about a fifth over playing away (home 1.1, away 0.9). */
export const HOME_EDGE = 1.1;
export const AWAY_EDGE = 0.9;

const GOALKEEPER = 1;

// Player totals in bootstrap grow from kick-off, so a match counts from kick-off too.
const counted = (f: Fixture) => f.started === true || f.finished || f.finished_provisional;

/** Matches each club has played or is playing. */
export function matchesPlayed(fixtures: readonly Fixture[]): Map<number, number> {
  const played = new Map<number, number>();
  for (const f of fixtures.filter(counted)) {
    played.set(f.team_h, (played.get(f.team_h) ?? 0) + 1);
    played.set(f.team_a, (played.get(f.team_a) ?? 0) + 1);
  }
  return played;
}

export interface Strengths {
  readonly teams: ReadonlyMap<number, TeamStrength>;
  /** League-average goals per team per match. */
  readonly average: number;
}

export function teamStrengths(bootstrap: Bootstrap, fixtures: readonly Fixture[]): Strengths {
  const played = matchesPlayed(fixtures);
  const xgFor = new Map<number, number>();
  const xgAgainst = new Map<number, number>();
  for (const e of bootstrap.elements) {
    xgFor.set(e.team, (xgFor.get(e.team) ?? 0) + (e.expected_goals ?? 0));
    if (e.element_type === GOALKEEPER) xgAgainst.set(e.team, (xgAgainst.get(e.team) ?? 0) + (e.expected_goals_conceded ?? 0));
  }
  const matches = [...played.values()].reduce((a, b) => a + b, 0);
  const sum = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  const average = matches > 0 ? (sum(xgFor) + sum(xgAgainst)) / 2 / matches : FALLBACK_GOALS;
  const shrink = (total: number, n: number) => (total + average * PRIOR_MATCHES) / (n + PRIOR_MATCHES);
  const teams = new Map(
    bootstrap.teams.map((t): [number, TeamStrength] => {
      const n = played.get(t.id) ?? 0;
      return [t.id, { team: t.id, played: n, attack: shrink(xgFor.get(t.id) ?? 0, n), defence: shrink(xgAgainst.get(t.id) ?? 0, n) }];
    }),
  );
  return { teams, average };
}

/** Goals `side` is expected to score against `opponent`. */
export function expectedGoals(side: TeamStrength, opponent: TeamStrength, home: boolean, average: number): number {
  return (side.attack * opponent.defence) / average * (home ? HOME_EDGE : AWAY_EDGE);
}

function outlook(side: TeamStrength, opponent: TeamStrength, home: boolean, average: number): MatchOutlook {
  const goalsAgainst = expectedGoals(opponent, side, !home, average);
  return {
    opponent: opponent.team,
    home,
    goalsFor: expectedGoals(side, opponent, home, average),
    goalsAgainst,
    cleanSheet: Math.exp(-goalsAgainst),
  };
}

const kickoff = (f: Fixture) => (f.kickoff_time ? Date.parse(f.kickoff_time) : Infinity);

/** Every club's matches in the window, in kickoff order, with goals and clean-sheet chances. */
export function teamOutlooks(strengths: Strengths, fixtures: readonly Fixture[], gws: readonly number[]): TeamOutlook[] {
  const window = new Set(gws);
  const byKey = new Map<string, MatchOutlook[]>();
  const add = (team: number, gw: number, match: MatchOutlook) =>
    byKey.set(`${team}:${gw}`, [...(byKey.get(`${team}:${gw}`) ?? []), match]);
  const inWindow = fixtures.filter((f) => f.event !== null && window.has(f.event));
  for (const f of [...inWindow].sort((a, b) => kickoff(a) - kickoff(b) || a.id - b.id)) {
    const [home, away] = [strengths.teams.get(f.team_h), strengths.teams.get(f.team_a)];
    if (!home || !away) continue;
    add(f.team_h, f.event!, outlook(home, away, true, strengths.average));
    add(f.team_a, f.event!, outlook(away, home, false, strengths.average));
  }
  return [...strengths.teams.keys()].map((team) => ({
    team,
    weeks: gws.map((gw) => ({ gw, matches: byKey.get(`${team}:${gw}`) ?? [] })),
  }));
}

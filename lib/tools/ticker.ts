import { getBootstrap, getFixtures } from "@/lib/fpl/api";
import type { Bootstrap, Fixture } from "@/lib/fpl/schemas";
import type { Difficulty, TickerMatch, TickerRow } from "./types";

// The fixture ticker: FPL's difficulty for every team over the next few
// gameweeks, with blank and double weeks. Built per request from the cached
// bootstrap and fixtures, like the league views (D1).

/** How many gameweeks the ticker shows by default. */
export const TICKER_WEEKS = 6;

/** A blank week scores worse than the hardest fixture: no match, no points. */
export const BLANK_COST = 6;

const isDifficulty = (n: number | null): n is Difficulty => n !== null && Number.isInteger(n) && n >= 1 && n <= 5;

/** From the next deadline, `weeks` long; fewer at the end of the season, none once it's over. */
export function tickerGameweeks(events: Bootstrap["events"], weeks: number): number[] {
  const next = events.find((e) => e.is_next)?.id;
  if (next === undefined) return [];
  const last = Math.max(...events.map((e) => e.id));
  return Array.from({ length: Math.max(0, Math.min(weeks, last - next + 1)) }, (_, i) => next + i);
}

/**
 * One week's share of the run score: a single match counts its difficulty, a
 * double (or more) its easiest match minus 1 per extra match, a blank BLANK_COST.
 */
export function weekCost(matches: readonly TickerMatch[]): number {
  if (!matches.length) return BLANK_COST;
  const easiest = Math.min(...matches.map((m) => m.difficulty));
  return Math.max(0, easiest - (matches.length - 1));
}

const kickoff = (f: Fixture) => (f.kickoff_time ? Date.parse(f.kickoff_time) : Infinity);

/** Each team's matches per gameweek in the window, in kickoff order. */
function matchesByTeamWeek(fixtures: readonly Fixture[], gws: ReadonlySet<number>, short: ReadonlyMap<number, string>) {
  const byKey = new Map<string, TickerMatch[]>();
  const add = (team: number, gw: number, match: TickerMatch) =>
    byKey.set(`${team}:${gw}`, [...(byKey.get(`${team}:${gw}`) ?? []), match]);
  const inWindow = fixtures.filter((f) => f.event !== null && gws.has(f.event));
  for (const f of [...inWindow].sort((a, b) => kickoff(a) - kickoff(b) || a.id - b.id)) {
    const [home, away] = [f.team_h_difficulty, f.team_a_difficulty];
    if (!isDifficulty(home) || !isDifficulty(away)) throw new Error(`[tools] fixture ${f.id} has no FPL difficulty`);
    add(f.team_h, f.event!, { opponent: short.get(f.team_a) ?? "?", home: true, difficulty: home });
    add(f.team_a, f.event!, { opponent: short.get(f.team_h) ?? "?", home: false, difficulty: away });
  }
  return byKey;
}

export function buildTicker(bootstrap: Bootstrap, fixtures: readonly Fixture[], weeks = TICKER_WEEKS): TickerRow[] {
  const gws = tickerGameweeks(bootstrap.events, weeks);
  const short = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const matches = matchesByTeamWeek(fixtures, new Set(gws), short);
  return bootstrap.teams.map((t) => {
    const teamWeeks = gws.map((gw) => ({ gw, matches: matches.get(`${t.id}:${gw}`) ?? [] }));
    return {
      team: { id: t.id, name: t.name, short: t.short_name },
      weeks: teamWeeks,
      runScore: teamWeeks.reduce((sum, w) => sum + weekCost(w.matches), 0),
    };
  });
}

/** The ticker from live FPL data. Throws when FPL can't be read (the screen shows its outage panel). */
export async function getTicker(weeks = TICKER_WEEKS): Promise<TickerRow[]> {
  const [bootstrap, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);
  return buildTicker(bootstrap, fixtures, weeks);
}

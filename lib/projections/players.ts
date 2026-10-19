import type { Bootstrap, Element } from "@/lib/fpl/schemas";
import { availability } from "./availability";
import { atLeast, expectedPer } from "./poisson";
import { CONCEDED_PER_POINT, DEFENSIVE_THRESHOLD, SAVES_PER_POINT, type Scoring, tableKey } from "./scoring";
import type { Strengths } from "./teams";
import type { MatchOutlook, PlayerProjection, Position, TeamOutlook, TeamStrength } from "./types";

// Expected points per player per match (CLAUDE.md, D7):
//
//   minutes  ← the player's season so far, relative to his club's matches
//   × rates  ← per-90 xG, xA, saves, defensive actions, bonus and bookings,
//              blended with the position's average until he has played a few games
//   × match  ← how many goals his club should score and concede in that match
//   × chance ← availability that gameweek
//
// FPL's points table turns each of those into points.

export const POSITIONS: Readonly<Record<number, Position>> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

/** Minutes of position-average rates blended into every player (three full matches). */
export const PRIOR_MINUTES = 270;

/** Players with at least this many minutes set a position's average rates. */
const SAMPLE_MINUTES = 450;

/** Of the matches a player starts, the share where he lasts 60 minutes. */
export const STARTS_LASTING_60 = 0.9;
/** Minutes a starter usually plays, and a substitute. */
const STARTER_MINUTES = 80;
const SUB_MINUTES = 25;
/** Share of a full match a starter is on the pitch for defensive actions. */
const STARTER_SHARE = 0.95;

type Stat = "expected_goals" | "expected_assists" | "saves" | "defensive_contribution" | "bonus" | "yellow_cards";
const STATS: readonly Stat[] = ["expected_goals", "expected_assists", "saves", "defensive_contribution", "bonus", "yellow_cards"];

type Rates = Readonly<Record<Stat, number>>;

/** Each position's average per-90 rates among regulars. */
export function positionRates(elements: readonly Element[]): ReadonlyMap<Position, Rates> {
  return new Map(
    Object.entries(POSITIONS).map(([type, position]) => {
      const regulars = elements.filter((e) => e.element_type === Number(type) && (e.minutes ?? 0) >= SAMPLE_MINUTES);
      const minutes = regulars.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
      const rate = (stat: Stat) => (minutes ? (regulars.reduce((sum, e) => sum + (e[stat] ?? 0), 0) / minutes) * 90 : 0);
      return [position, Object.fromEntries(STATS.map((s) => [s, rate(s)])) as Rates];
    }),
  );
}

/** A player's per-90 rates, leaning on the position's average while his minutes are few. */
export function playerRates(e: Element, prior: Rates): Rates {
  const minutes = e.minutes ?? 0;
  const per90 = (stat: Stat) => ((e[stat] ?? 0) + (prior[stat] * PRIOR_MINUTES) / 90) / ((minutes + PRIOR_MINUTES) / 90);
  return Object.fromEntries(STATS.map((s) => [s, per90(s)])) as Rates;
}

/** How often he plays, per club match: 60+ minutes, 1–59 minutes, and minutes overall. */
export function playingTime(e: Element, clubMatches: number) {
  if (clubMatches <= 0) return { long: 0, short: 0, minutes: 0 };
  const minutes = Math.min(90, (e.minutes ?? 0) / clubMatches);
  const starts = Math.min(1, (e.starts ?? 0) / clubMatches);
  const long = Math.min(starts * STARTS_LASTING_60, minutes / 70);
  const appears = Math.min(1, starts + Math.max(0, minutes - starts * STARTER_MINUTES) / SUB_MINUTES);
  return { long, short: Math.max(0, Math.min(1 - long, appears - long)), minutes };
}

interface Context {
  readonly position: Position;
  readonly rates: Rates;
  readonly time: ReturnType<typeof playingTime>;
  readonly club: TeamStrength;
  readonly scoring: Scoring;
}

/** Expected points in one match, before availability. */
export function matchPoints(match: MatchOutlook, { position, rates, time, club, scoring }: Context): number {
  const key = tableKey(position);
  const share = time.minutes / 90;
  const attack = match.goalsFor / club.attack;
  const defence = club.defence / match.goalsAgainst;
  const threshold = DEFENSIVE_THRESHOLD[position];
  const goals = rates.expected_goals * share * attack * scoring.goals_scored[key];
  const assists = rates.expected_assists * share * attack * scoring.assists;
  const appearance = time.long * scoring.long_play + time.short * scoring.short_play;
  const cleanSheet = time.long * match.cleanSheet * scoring.clean_sheets[key];
  const conceded = time.long * expectedPer(CONCEDED_PER_POINT, match.goalsAgainst) * scoring.goals_conceded[key];
  const saves =
    position === "GK" ? time.long * expectedPer(SAVES_PER_POINT, rates.saves * (match.goalsAgainst / club.defence)) * scoring.saves : 0;
  const defensive =
    threshold === null ? 0 : time.long * atLeast(threshold, rates.defensive_contribution * STARTER_SHARE) * scoring.defensive_contribution[key];
  const bonus = rates.bonus * share * (position === "GK" || position === "DEF" ? defence : attack) * scoring.bonus;
  const bookings = rates.yellow_cards * share * scoring.yellow_cards;
  return goals + assists + appearance + cleanSheet + conceded + saves + defensive + bonus + bookings;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function projectPlayers(
  bootstrap: Bootstrap,
  strengths: Strengths,
  outlooks: readonly TeamOutlook[],
  deadlines: readonly number[],
  played: ReadonlyMap<number, number>,
  scoring: Scoring,
): PlayerProjection[] {
  const priors = positionRates(bootstrap.elements);
  const outlookOf = new Map(outlooks.map((o) => [o.team, o]));
  return bootstrap.elements.flatMap((e): PlayerProjection[] => {
    const position = POSITIONS[e.element_type];
    const club = strengths.teams.get(e.team);
    const outlook = outlookOf.get(e.team);
    if (!position || !club || !outlook) return [];
    const context: Context = { position, rates: playerRates(e, priors.get(position)!), time: playingTime(e, played.get(e.team) ?? 0), club, scoring };
    const chances = availability(e, deadlines);
    const points = outlook.weeks.map((week, i) =>
      round(chances[i] * week.matches.reduce((sum, match) => sum + matchPoints(match, context), 0)),
    );
    return [{ id: e.id, points, total: round(points.reduce((a, b) => a + b, 0)), minutes: Math.round(context.time.minutes) }];
  });
}

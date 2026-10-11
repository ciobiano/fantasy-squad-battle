import { AWARD_ORDER, type Award, type AwardId, type AwardWinner, type CaptainFact, type Manager, type Score } from "./types";

// The 8 awards (CLAUDE.md: "Awards and cards" and decisions D3–D6). Ties share
// the award. An award nobody qualifies for is skipped, and the Wrap gets a
// group line for it instead.

/** Everything an award needs to know about one manager in one gameweek. */
export interface Contender {
  readonly manager: Manager;
  /** null: hadn't started playing FPL by this gameweek. */
  readonly score: Score | null;
  readonly benchPoints: number | null;
  readonly captain: CaptainFact | null;
  /** League rank now, and one gameweek ago. */
  readonly rank: number | null;
  readonly previousRank: number | null;
  /** League ranks two gameweeks ago, one ago, and now (for Middle Class). */
  readonly recentRanks: readonly (number | null)[];
}

/** Captain Disaster: the chosen captain scored this many points or fewer. */
export const CAPTAIN_DISASTER_MAX = 2;

const byName = (a: AwardWinner, b: AwardWinner) =>
  a.manager.firstName.localeCompare(b.manager.firstName) ||
  a.manager.teamName.localeCompare(b.manager.teamName) ||
  a.manager.id - b.manager.id;

const award = (id: AwardId, stat: number, winners: readonly AwardWinner[]): Award => ({
  id,
  stat,
  winners: [...winners].sort(byName),
});

/** Everyone who shares the best value; null when nobody has a value at all. */
function leaders(
  contenders: readonly Contender[],
  value: (c: Contender) => number | null,
  direction: "highest" | "lowest",
): { best: number; who: Contender[] } | null {
  const valued = contenders.flatMap((c) => {
    const v = value(c);
    return v === null ? [] : [{ c, v }];
  });
  if (!valued.length) return null;
  const values = valued.map((x) => x.v);
  const best = direction === "highest" ? Math.max(...values) : Math.min(...values);
  return { best, who: valued.filter((x) => x.v === best).map((x) => x.c) };
}

const rankChange = (c: Contender) =>
  c.rank !== null && c.previousRank !== null ? c.previousRank - c.rank : null;
const net = (c: Contender) => c.score?.net ?? null;

function oga(cs: readonly Contender[]): Award | null {
  const top = leaders(cs, net, "highest");
  return top && award("oga", top.best, top.who.map((c) => ({ manager: c.manager, score: c.score! })));
}

function woodenSpoon(cs: readonly Contender[]): Award | null {
  const bottom = leaders(cs, net, "lowest");
  const top = leaders(cs, net, "highest");
  // Nobody is last when everyone scored the same.
  if (!bottom || !top || bottom.best === top.best) return null;
  return award("woodenSpoon", bottom.best, bottom.who.map((c) => ({ manager: c.manager, score: c.score! })));
}

function captainDisaster(cs: readonly Contender[]): Award | null {
  const worst = leaders(cs, (c) => c.captain?.points ?? null, "lowest");
  if (!worst || worst.best > CAPTAIN_DISASTER_MAX) return null;
  return award("captainDisaster", worst.best, worst.who.map((c) => ({ manager: c.manager, captain: c.captain! })));
}

function benchRegret(cs: readonly Contender[]): Award | null {
  const most = leaders(cs, (c) => c.benchPoints, "highest");
  return most && most.best > 0 ? award("benchRegret", most.best, most.who.map((c) => ({ manager: c.manager }))) : null;
}

function hitMerchant(cs: readonly Contender[]): Award | null {
  const most = leaders(cs, (c) => c.score?.hits ?? null, "highest");
  if (!most || most.best <= 0) return null;
  return award("hitMerchant", most.best, most.who.map((c) => ({ manager: c.manager, score: c.score! })));
}

const withRanks = (c: Contender): AwardWinner => ({
  manager: c.manager,
  ranks: { from: c.previousRank!, to: c.rank! },
});

function climber(cs: readonly Contender[]): Award | null {
  const most = leaders(cs, rankChange, "highest");
  return most && most.best > 0 ? award("climber", most.best, most.who.map(withRanks)) : null;
}

function faller(cs: readonly Contender[]): Award | null {
  const most = leaders(cs, rankChange, "lowest");
  return most && most.best < 0 ? award("faller", -most.best, most.who.map(withRanks)) : null;
}

/** D3: the middle third of the table, with league rank moved 1 place or less over the last 3 gameweeks. */
function middleClass(cs: readonly Contender[], gw: number): Award | null {
  if (gw < 3) return null;
  const ranked = cs.filter((c) => c.rank !== null);
  const third = Math.floor(ranked.length / 3);
  if (third < 1) return null;
  const steady = ranked.filter((c) => {
    const inMiddle = c.rank! > third && c.rank! <= ranked.length - third;
    const recent = c.recentRanks;
    if (!inMiddle || recent.length < 3 || recent.some((r) => r === null)) return false;
    const ranks = recent as readonly number[];
    return Math.max(...ranks) - Math.min(...ranks) <= 1;
  });
  if (!steady.length) return null;
  return award(
    "middleClass",
    steady.length,
    steady.map((c) => ({ manager: c.manager, ranks: { from: c.recentRanks[0]!, to: c.rank! } })),
  );
}

export function computeAwards(
  contenders: readonly Contender[],
  gw: number,
): { readonly awards: readonly Award[]; readonly skipped: readonly AwardId[] } {
  const results: Record<AwardId, Award | null> = {
    oga: oga(contenders),
    climber: climber(contenders),
    captainDisaster: captainDisaster(contenders),
    benchRegret: benchRegret(contenders),
    hitMerchant: hitMerchant(contenders),
    middleClass: middleClass(contenders, gw),
    faller: faller(contenders),
    woodenSpoon: woodenSpoon(contenders),
  };
  return {
    awards: AWARD_ORDER.flatMap((id) => (results[id] ? [results[id]!] : [])),
    skipped: AWARD_ORDER.filter((id) => !results[id]),
  };
}

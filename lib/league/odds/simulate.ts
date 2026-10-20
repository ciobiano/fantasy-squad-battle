import { COMEBACK_CHANCE, GHOST_DECLINE, GHOST_FLOOR, QUIT_CHANCE, WEEKLY_LUCK, type Outlook } from "./model";

// Plays the rest of the season many times. Each week every manager scores
// their edge plus luck; anyone may quit and start sliding, as ghosts already
// are, and a ghost may come back. The share of seasons each manager finishes
// first, top three and last are their odds.
//
// Weekly luck is independent from week to week, so a season's worth adds up
// to one normal draw of WEEKLY_LUCK × √weeks; the weeks someone quits and comes
// back are one draw each too. Same model as playing week by week, about 30×
// faster. The random numbers are seeded by league and gameweek, so a card
// shows the same odds however often it's opened or shared.

/** Seasons played per forecast: ±0.5% on a 30% chance. */
export const SEASONS = 10_000;

export interface Odds {
  /** Chances, 0–1. */
  readonly win: number;
  readonly top3: number;
  readonly last: number;
}

/** FNV-1a, then mulberry32: small, fast and the same everywhere. */
export function seededRandom(key: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal draw (Box–Muller). */
function normal(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

/** Weeks until something with a weekly chance `p` happens (1 = next week). */
function weeksUntil(p: number, random: () => number): number {
  return Math.ceil(Math.log(1 - random()) / Math.log(1 - p));
}

/** Points lost over `weeks` weeks of sliding: GHOST_DECLINE more each week, up to GHOST_FLOOR. */
export function slide(weeks: number): number {
  if (weeks <= 0) return 0;
  const ramp = Math.min(weeks, Math.floor(GHOST_FLOOR / GHOST_DECLINE));
  return (GHOST_DECLINE * ramp * (ramp + 1)) / 2 + GHOST_FLOOR * (weeks - ramp);
}

/** One manager's points from now to the end of one simulated season. */
function restOfSeason(o: Outlook, weeks: number, random: () => number): number {
  const quits = o.activity === "ghost" ? 0 : weeksUntil(QUIT_CHANCE, random);
  const sliding = quits >= weeks ? 0 : Math.min(weeks - quits, weeksUntil(COMEBACK_CHANCE, random) - 1);
  return o.chipPoints + o.edge * weeks - slide(sliding) + WEEKLY_LUCK * Math.sqrt(weeks) * normal(random);
}

/**
 * Odds for each manager, in input order, after `gw` with the season ending at `lastGw`.
 * Only the margin over the gameweek average is simulated: the average is the same for everyone.
 */
export function simulateSeason(outlooks: readonly Outlook[], gw: number, lastGw: number, seed: string, seasons = SEASONS): Odds[] {
  const n = outlooks.length;
  const weeks = lastGw - gw;
  const random = seededRandom(seed);
  const [wins, top3, last] = [new Array(n).fill(0), new Array(n).fill(0), new Array(n).fill(0)];
  const podium = Math.min(3, n);
  for (let season = 0; season < seasons; season++) {
    // Only the top three and the last matter, so one pass finds them (no full sort).
    const top = [-1, -1, -1];
    const topTotals = [-Infinity, -Infinity, -Infinity];
    let bottom = 0;
    let bottomTotal = Infinity;
    for (let m = 0; m < n; m++) {
      const total = outlooks[m].total + restOfSeason(outlooks[m], weeks, random);
      if (total < bottomTotal) [bottom, bottomTotal] = [m, total];
      for (let k = 0; k < podium; k++) {
        if (total > topTotals[k]) {
          top.splice(k, 0, m);
          topTotals.splice(k, 0, total);
          top.length = topTotals.length = 3;
          break;
        }
      }
    }
    wins[top[0]]++;
    for (let k = 0; k < podium; k++) top3[top[k]]++;
    last[bottom]++;
  }
  return outlooks.map((_, m) => ({ win: wins[m] / seasons, top3: top3[m] / seasons, last: last[m] / seasons }));
}

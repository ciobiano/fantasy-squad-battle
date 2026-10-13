import type { AwardId } from "@/lib/league/types";

// The shape every language's roast lines fill in (lines/pcm.ts, en.ts, fr.ts),
// so a missing pool is a type error. Lines are templates: {name} and friends
// are filled from the award's facts, and a seed of league + GW + award picks
// one line per card, so a card reads the same however often it's shared.

/** Same as the design session's Lang (lib/i18n); becomes that import once both branches are on main. */
export type Lang = "pcm" | "en" | "fr";

/**
 * Which situation a line is written for. Placeholders each pool can use
 * ({gw} works everywhere):
 *
 * | Pool | When | Placeholders |
 * |---|---|---|
 * | one | a single winner | {name} {team}, plus the award's own (below) |
 * | few | 2–3 winners, all named on the card | {names} {count}, plus the shared number |
 * | crowd | 4+ winners: the card names 3, then "+N others" | {count}, plus the shared number |
 * | nobody | nobody won: the Wrap's group line | {gw} only |
 * | early | too early in the season for the award | {gw} only |
 *
 * The award's own placeholders:
 * - oga, spoon: {score} (net). spoon `paid` (last after taking a hit) adds {hits}.
 * - climber, faller: {places} ("3 places"); `one` adds {from} {to} ("12th").
 *   climber `newLeader` (climbed to 1st) has {from}; faller `fromTop` (fell from 1st) has {to}.
 * - captain: {captainPoints} ("1 point"); solo pools add {captain} (the player).
 *   `noShow`: the captain didn't play. `rescued`: didn't play, the vice did.
 *   `triple`: Triple Captain. `sameCaptain`: 2+ winners, one captain: {count} {captain} {captainPoints}.
 * - bench: {bench} ("21 points").
 * - hits: {hits} ("8 points"); `one` adds {points} (before hits) and {score} (after).
 * - middle: nothing extra.
 *
 * Write lines so they read right for any number: units come with the number
 * ("1 point", "8 points"). Keep them short: a filled line must fit 100
 * characters (the card shows about four lines of roast).
 */
type Common = "one" | "few" | "crowd" | "nobody";

export interface PoolsByAward {
  readonly oga: Common;
  readonly climber: Common | "early" | "newLeader";
  readonly captain: Common | "noShow" | "rescued" | "triple" | "sameCaptain";
  readonly bench: Common;
  readonly hits: Common;
  readonly middle: Common | "early";
  readonly faller: Common | "early" | "fromTop";
  readonly spoon: Common | "paid";
}

export type Pool = PoolsByAward[AwardId];

export type RoastBook = { readonly [A in AwardId]: { readonly [P in PoolsByAward[A]]: readonly string[] } };

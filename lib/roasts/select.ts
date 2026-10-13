import { MIDDLE_CLASS_WEEKS } from "@/lib/league/awards";
import type { Award, AwardId, AwardWinner } from "@/lib/league/types";
import type { Lang, Pool } from "./book";
import { nameList, ordinal, signed, unit, type Vars } from "./text";

// Which pool of lines fits an award's facts, and the placeholders that pool gets.

/** Cards name up to this many winners, then "+N others"; more than this is a crowd. */
export const NAMED_MAX = 3;

/** The captain most winners picked, and how many picked him (ties go to the first name). */
function topCaptain(winners: readonly AwardWinner[]): { readonly name: string; readonly count: number } {
  const counts = new Map<string, number>();
  for (const w of winners) if (w.captain) counts.set(w.captain.name, (counts.get(w.captain.name) ?? 0) + 1);
  const [name, count] = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0] ?? ["", 0];
  return { name, count };
}

/** Everyone picked one captain, or most of a crowd did (GW1: 32 of 43 on Fernandes). */
function sharedCaptain(winners: readonly AwardWinner[]): boolean {
  const { count } = topCaptain(winners);
  return count === winners.length || (winners.length > NAMED_MAX && count * 2 > winners.length);
}

function soloPool(award: Award): Pool {
  const w = award.winners[0];
  switch (award.id) {
    case "climber":
      return w.ranks?.to === 1 ? "newLeader" : "one";
    case "faller":
      return w.ranks?.from === 1 ? "fromTop" : "one";
    case "spoon":
      return (w.score?.hits ?? 0) > 0 ? "paid" : "one";
    case "captain": {
      const c = w.captain;
      if (c?.minutes === 0) return c.viceRescued ? "rescued" : "noShow";
      return c?.tripleCaptain ? "triple" : "one";
    }
    default:
      return "one";
  }
}

export function poolFor(award: Award): Pool {
  const n = award.winners.length;
  if (award.id === "captain" && n > 1 && sharedCaptain(award.winners)) return "sameCaptain";
  if (n > NAMED_MAX) return "crowd";
  if (n > 1) return "few";
  return soloPool(award);
}

/** The Wrap's line for an award nobody won: "early" when the season is too young for it. */
export function skippedPool(id: AwardId, gw: number): "early" | "nobody" {
  if ((id === "climber" || id === "faller") && gw <= 1) return "early";
  if (id === "middle" && gw < MIDDLE_CLASS_WEEKS) return "early";
  return "nobody";
}

/** The number every winner shares, with its unit. */
function sharedVars(award: Award, lang: Lang): Vars {
  switch (award.id) {
    case "oga":
    case "spoon":
      return { score: signed(award.stat) };
    case "climber":
    case "faller":
      return { places: unit(award.stat, "place", lang) };
    case "captain":
      return { captainPoints: unit(award.stat, "point", lang) };
    case "bench":
      return { bench: unit(award.stat, "point", lang) };
    case "hits":
      return { hits: unit(award.stat, "point", lang) };
    case "middle":
      return {};
  }
}

/** What only a single winner has: their ranks, their captain, their breakdown. */
function soloVars(award: Award, pool: Pool, lang: Lang): Vars {
  const w = award.winners[0];
  const from = w.ranks ? ordinal(w.ranks.from, lang) : undefined;
  const to = w.ranks ? ordinal(w.ranks.to, lang) : undefined;
  const base = { name: w.manager.firstName, team: w.manager.teamName };
  switch (pool) {
    case "one":
      if (award.id === "climber" || award.id === "faller") return { ...base, from: from!, to: to! };
      if (award.id === "captain") return { ...base, captain: w.captain!.name };
      if (award.id === "hits") return { ...base, points: String(w.score!.points), score: signed(w.score!.net) };
      return base;
    case "newLeader":
      return { ...base, from: from! };
    case "fromTop":
      return { ...base, to: to! };
    case "paid":
      return { ...base, hits: unit(w.score!.hits, "point", lang) };
    case "noShow":
    case "rescued":
    case "triple":
      return { ...base, captain: w.captain!.name };
    default:
      return base;
  }
}

export function varsFor(award: Award, pool: Pool, lang: Lang, gw: number): Vars {
  const shared = { gw: String(gw), ...sharedVars(award, lang) };
  switch (pool) {
    case "sameCaptain": {
      const top = topCaptain(award.winners);
      return { ...shared, count: String(top.count), captain: top.name };
    }
    case "crowd":
      return { ...shared, count: String(award.winners.length) };
    case "few":
      return {
        ...shared,
        count: String(award.winners.length),
        names: nameList(award.winners.map((w) => w.manager.firstName), lang),
      };
    default:
      return { ...shared, ...soloVars(award, pool, lang) };
  }
}

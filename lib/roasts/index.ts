import type { Award, AwardId, LeagueView } from "@/lib/league/types";
import type { Lang, Pool, RoastBook } from "./book";
import { en } from "./lines/en";
import { fr } from "./lines/fr";
import { pcm } from "./lines/pcm";
import { poolFor, skippedPool, varsFor } from "./select";
import { pickLine } from "./text";

// Roast lines for the cards and the Wrap, added last and per language (D2):
// the award facts never change with the language, only the words around them.

const BOOKS: Readonly<Record<Lang, RoastBook>> = { pcm, en, fr };

export interface RoastContext {
  readonly leagueId: number;
  readonly gw: number;
  readonly lang: Lang;
}

function linesOf(id: AwardId, pool: Pool, lang: Lang): readonly string[] {
  const pools: Partial<Record<Pool, readonly string[]>> = BOOKS[lang][id];
  return pools[pool] ?? [];
}

/** One seed per league, gameweek and award, so a shared card always reads the same. */
const seedKey = (id: AwardId, ctx: RoastContext) => `${ctx.leagueId}:${ctx.gw}:${id}`;

/** The roast for an award's card: the line that fits its facts, picked by the seed and filled in. */
export function roastFor(award: Award, ctx: RoastContext): string {
  const pool = poolFor(award);
  const vars = varsFor(award, pool, ctx.lang, ctx.gw);
  return pickLine(linesOf(award.id, pool, ctx.lang), seedKey(award.id, ctx), vars) ?? "";
}

/** The Wrap's group line for an award nobody won, e.g. "Nobody take hit this week. Una too dey fear." */
export function groupLineFor(id: AwardId, ctx: RoastContext): string {
  const lines = linesOf(id, skippedPool(id, ctx.gw), ctx.lang);
  return pickLine(lines, seedKey(id, ctx), { gw: String(ctx.gw) }) ?? "";
}

export interface ViewRoasts {
  /** A roast for every award in the view. */
  readonly roasts: Readonly<Partial<Record<AwardId, string>>>;
  /** A group line for every skipped award. */
  readonly groupLines: Readonly<Partial<Record<AwardId, string>>>;
}

/** Every roast and group line for one league view, in one language. */
export function roastView(view: LeagueView, lang: Lang): ViewRoasts {
  const ctx = { leagueId: view.league.id, gw: view.gameweek.id, lang };
  return {
    roasts: Object.fromEntries(view.awards.map((a) => [a.id, roastFor(a, ctx)])),
    groupLines: Object.fromEntries(view.skipped.map((id) => [id, groupLineFor(id, ctx)])),
  };
}

export type { Lang } from "./book";

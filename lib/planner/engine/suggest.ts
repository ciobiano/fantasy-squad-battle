import { rateSquad } from "./rating";
import { clubIssues, sellingPrice } from "./rules";
import type { Context } from "./simulate";
import type { EnginePlayer, Owned, Start } from "./types";

// Transfer ideas: every swap the budget and club limit allow, scored by how
// much it lifts the squad's rating over the window, net of a hit when no free
// transfer is left. FFS keeps this behind its Chief Scout plan; ours is free.

export interface TransferIdea {
  readonly transfers: readonly { readonly out: number; readonly in: number }[];
  /** Rating gained over the window, after any hit. */
  readonly gain: number;
  /** Bank afterwards, in tenths. */
  readonly bank: number;
}

/** Candidates per position: the best `perPosition` players over the window. */
const CANDIDATES = 40;
/** Singles combined into pairs. */
const PAIR_POOL = 20;

const total = (p: EnginePlayer) => p.points.reduce((a, b) => a + b, 0);
const round = (n: number) => Math.round(n * 100) / 100;

function shortlist(start: Start, ctx: Context): EnginePlayer[] {
  const owned = new Set(start.squad.map((o) => o.id));
  const byPosition = new Map<string, EnginePlayer[]>();
  for (const p of ctx.players.values()) if (!owned.has(p.id)) byPosition.set(p.position, [...(byPosition.get(p.position) ?? []), p]);
  return [...byPosition.values()].flatMap((list) => list.sort((a, b) => total(b) - total(a)).slice(0, CANDIDATES));
}

/** The squad and bank after `swaps`, or null when the money or the club limit says no. */
function apply(start: Start, swaps: TransferIdea["transfers"], ctx: Context): { squad: Owned[]; bank: number } | null {
  let squad: Owned[] = [...start.squad];
  let bank = start.bank;
  for (const { out, in: incoming } of swaps) {
    const sold = squad.find((o) => o.id === out);
    const [outP, inP] = [ctx.players.get(out), ctx.players.get(incoming)];
    if (!sold || !outP || !inP || outP.position !== inP.position || squad.some((o) => o.id === incoming)) return null;
    bank += sellingPrice(sold.bought, outP.price, ctx.rules.sellOnFee) - inP.price;
    squad = squad.map((o) => (o.id === out ? { id: incoming, bought: inP.price } : o));
  }
  if (bank < 0 || clubIssues(squad.map((o) => o.id), ctx.players, ctx.rules).length) return null;
  return { squad, bank };
}

function score(start: Start, swaps: TransferIdea["transfers"], base: number, ctx: Context): TransferIdea | null {
  const after = apply(start, swaps, ctx);
  if (!after) return null;
  const hits = Math.max(0, swaps.length - start.freeTransfers);
  const gain = rateSquad(after.squad.map((o) => o.id), ctx).points - base - hits * ctx.rules.hitCost;
  return { transfers: swaps, gain: round(gain), bank: after.bank };
}

/** The best single transfers, best first. Only those that gain are returned. */
export function suggestTransfers(start: Start, ctx: Context, limit = 10): TransferIdea[] {
  const base = rateSquad(start.squad.map((o) => o.id), ctx).points;
  const candidates = shortlist(start, ctx);
  const ideas = start.squad.flatMap((o) => {
    const out = ctx.players.get(o.id);
    if (!out) return [];
    // A player projected no better over the window almost never lifts the rating, so he isn't scored (3× faster).
    return candidates
      .filter((c) => c.position === out.position && total(c) > total(out))
      .map((c) => score(start, [{ out: o.id, in: c.id }], base, ctx))
      .filter((idea): idea is TransferIdea => idea !== null && idea.gain > 0);
  });
  return ideas.sort((a, b) => b.gain - a.gain).slice(0, limit);
}

/** The best two-transfer moves, built from the strongest singles. Only those that gain are returned. */
export function suggestPairs(start: Start, ctx: Context, limit = 5): TransferIdea[] {
  const base = rateSquad(start.squad.map((o) => o.id), ctx).points;
  const singles = suggestTransfers(start, ctx, PAIR_POOL).map((idea) => idea.transfers[0]);
  const pairs: TransferIdea[] = [];
  singles.forEach((a, i) =>
    singles.slice(i + 1).forEach((b) => {
      if (a.out === b.out || a.in === b.in) return;
      const idea = score(start, [a, b], base, ctx);
      if (idea && idea.gain > 0) pairs.push(idea);
    }),
  );
  return pairs.sort((a, b) => b.gain - a.gain).slice(0, limit);
}

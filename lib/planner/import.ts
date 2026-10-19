import { getEntry, getHistory, getPicks, getPlayerSummary, getTransfers } from "@/lib/fpl/api";
import type { Bootstrap, Entry, History, Picks, PlayerSummary, Transfers } from "@/lib/fpl/schemas";
import type { Chip, Owned, Rules, Start } from "./engine/types";

// A manager's squad as of the last deadline, from public FPL data only. FFS's
// Draft Tool imports the same thing: the latest squad FPL has made public.
// Transfers made since the deadline need the manager's FPL login, which we
// never ask for, so the screen labels the squad "as of GW{n}".
//
// Two numbers FPL shows only to the owner are estimated:
// - Prices paid: the last transfer in (entry/{id}/transfers/), or the price
//   when the team started for players held since then. Selling prices follow
//   from these with FPL's rule (lib/planner/engine/rules.ts).
// - Free transfers: replayed from the season's history with FPL's rules.

export interface ImportSource {
  entry(teamId: number): Promise<Entry | null>;
  history(teamId: number, gw: number): Promise<History>;
  picks(teamId: number, gw: number): Promise<Picks | null>;
  transfers(teamId: number): Promise<Transfers | null>;
  playerSummary(playerId: number): Promise<PlayerSummary | null>;
}

export const liveImport: ImportSource = {
  entry: getEntry,
  history: (teamId, gw) => getHistory(teamId, gw, false),
  picks: (teamId, gw) => getPicks(teamId, gw, false),
  transfers: getTransfers,
  playerSummary: getPlayerSummary,
};

export type SquadImport =
  | {
      readonly kind: "ready";
      readonly team: { readonly id: number; readonly name: string };
      /** The gameweek whose squad this is ("as of GW7"). */
      readonly asOf: number;
      readonly start: Start;
      /** Players whose price paid is a guess (no transfer record and no price history). */
      readonly guessedPrices: readonly number[];
    }
  | { readonly kind: "team-not-found" }
  /** The team hasn't played a gameweek yet. */
  | { readonly kind: "no-squad" };

const CHIP_NAMES: ReadonlySet<string> = new Set<Chip>(["wildcard", "freehit", "bboost", "3xc"]);
const TRANSFER_CHIPS: ReadonlySet<string> = new Set(["wildcard", "freehit"]);

/**
 * Free transfers for the gameweek after `upTo`, replayed from the season.
 * One a week after the first, up to the most FPL allows; a week's transfers
 * spend them, and hits never go below zero. A Wildcard or Free Hit week uses
 * that week's transfer and keeps the saved ones (FPL rules since 2024/25).
 */
export function freeTransfersAfter(history: History, startedEvent: number, upTo: number, rules: Rules): number {
  const chipWeeks = new Set(history.chips.filter((c) => TRANSFER_CHIPS.has(c.name)).map((c) => c.event));
  const rows = history.current.filter((r) => r.event > startedEvent && r.event <= upTo).sort((a, b) => a.event - b.event);
  return rows.reduce(
    (free, row) => (chipWeeks.has(row.event) ? free : Math.min(rules.maxFreeTransfers, Math.max(0, free - row.event_transfers) + 1)),
    1,
  );
}

/** Price paid for each player: his last transfer in (Free Hit weeks aside), else `fallback`. */
export function pricesPaid(squad: readonly number[], transfers: Transfers, freeHitWeeks: ReadonlySet<number>, fallback: ReadonlyMap<number, number>) {
  const latest = new Map<number, number>();
  for (const t of [...transfers].filter((t) => !freeHitWeeks.has(t.event)).sort((a, b) => a.time.localeCompare(b.time))) {
    latest.set(t.element_in, t.element_in_cost);
  }
  return new Map(squad.map((id) => [id, latest.get(id) ?? fallback.get(id)]));
}

/** Prices when the team started, for players with no transfer record: the GW1 price, or the price that gameweek. */
async function startPrices(ids: readonly number[], started: number, bootstrap: Bootstrap, source: ImportSource): Promise<Map<number, number>> {
  const element = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const seasonStart = (id: number) => {
    const e = element.get(id);
    return e?.now_cost != null && e.cost_change_start != null ? e.now_cost - e.cost_change_start : undefined;
  };
  if (started <= 1) return new Map(ids.flatMap((id) => (seasonStart(id) === undefined ? [] : [[id, seasonStart(id)!]])));
  const summaries = await Promise.all(ids.map((id) => source.playerSummary(id)));
  return new Map(
    ids.flatMap((id, i) => {
      const then = summaries[i]?.history.find((h) => h.round === started)?.value ?? seasonStart(id);
      return then == null ? [] : [[id, then]];
    }),
  );
}

export async function importSquad(teamId: number, bootstrap: Bootstrap, rules: Rules, source: ImportSource = liveImport): Promise<SquadImport> {
  const entry = await source.entry(teamId);
  if (!entry) return { kind: "team-not-found" };
  const current = entry.current_event;
  if (current === null) return { kind: "no-squad" };
  const [history, latestPicks, transfers] = await Promise.all([source.history(teamId, current), source.picks(teamId, current), source.transfers(teamId)]);
  if (!latestPicks) return { kind: "no-squad" };

  // A Free Hit squad lasts one week; the squad that carries on is the one before it.
  const onFreeHit = latestPicks.active_chip === "freehit";
  const asOf = onFreeHit ? current - 1 : current;
  const picks = onFreeHit ? await source.picks(teamId, asOf) : latestPicks;
  if (!picks) return { kind: "no-squad" };

  const squad = picks.picks.map((p) => p.element);
  const started = entry.started_event ?? 1;
  const freeHitWeeks = new Set(history.chips.filter((c) => c.name === "freehit").map((c) => c.event));
  const held = new Set((transfers ?? []).filter((t) => !freeHitWeeks.has(t.event)).map((t) => t.element_in));
  const fallback = await startPrices(squad.filter((id) => !held.has(id)), started, bootstrap, source);
  const paid = pricesPaid(squad, transfers ?? [], freeHitWeeks, fallback);
  const now = new Map(bootstrap.elements.map((e) => [e.id, e.now_cost]));
  const guessedPrices = squad.filter((id) => paid.get(id) === undefined);
  const owned: Owned[] = squad.map((id) => ({ id, bought: paid.get(id) ?? now.get(id) ?? 0 }));

  const bankRow = history.current.find((r) => r.event === asOf)?.bank;
  return {
    kind: "ready",
    team: { id: entry.id, name: entry.name },
    asOf,
    start: {
      gw: current + 1,
      squad: owned,
      bank: bankRow ?? entry.last_deadline_bank ?? 0,
      freeTransfers: freeTransfersAfter(history, started, current, rules),
      chipsUsed: history.chips.flatMap((c) => (CHIP_NAMES.has(c.name) ? [{ chip: c.name as Chip, gw: c.event }] : [])),
    },
    guessedPrices,
  };
}

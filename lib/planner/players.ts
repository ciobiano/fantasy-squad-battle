import type { Bootstrap, Element } from "@/lib/fpl/schemas";
import { POSITIONS } from "@/lib/projections/players";
import type { Projections } from "@/lib/projections/types";
import type { EnginePlayer } from "./engine/types";

// The player list the planner screen sends to the browser: what the engine
// needs, plus what the screen shows beside each player. Kept lean, because it
// goes over Nigerian mobile data (about 20 KB gzipped for the whole league).

/** FPL's own forecast of the next price change (bootstrap price_change_projections). */
export interface PriceTrend {
  readonly direction: "rise" | "fall";
  /** When FPL expects it: one of its next nightly price-change times (ISO), or null if it gave none. */
  readonly at: string | null;
  /** FPL's confidence, 1 (low) to 5 (high). */
  readonly likelihood: number;
}

export interface PlannerPlayer extends EnginePlayer {
  /** FPL's short name, e.g. "Haaland". */
  readonly name: string;
  /** FPL's status: a available, d doubtful, i injured, s suspended, u/n left or unavailable. */
  readonly status: string;
  /** Chance of playing next round (0–100), when FPL gives one. */
  readonly chance: number | null;
  readonly news: string;
  /** Share of FPL managers who own him, in percent. */
  readonly ownership: number;
  /** FPL's form: average points over the last 30 days. Never call it a projection. */
  readonly form: number;
  /** First-choice penalty taker. */
  readonly penalties: boolean;
  readonly priceTrend: PriceTrend | null;
}

/** A forecast counts once it reaches the threshold (100%) by one of the next price-change times. */
const THRESHOLD = 100;

export function priceTrend(e: Element, deadlines: readonly string[]): PriceTrend | null {
  const next = [...(e.price_change_projections ?? [])]
    .sort((a, b) => a.offset - b.offset)
    .find((p) => Math.abs(p.projected_percent) >= THRESHOLD);
  if (!next) return null;
  return {
    direction: next.projected_percent > 0 ? "rise" : "fall",
    at: deadlines[next.offset] ?? null,
    likelihood: Math.min(5, Math.abs(next.likelihood)),
  };
}

/** Every player who can be picked, plus `owned` ones who can't any more (they can still be sold). */
export function plannerPlayers(bootstrap: Bootstrap, projections: Projections, owned: ReadonlySet<number> = new Set()): PlannerPlayer[] {
  const projected = new Map(projections.players.map((p) => [p.id, p]));
  const deadlines = bootstrap.game_config?.settings.price_change_deadlines ?? [];
  return bootstrap.elements.flatMap((e): PlannerPlayer[] => {
    const position = POSITIONS[e.element_type];
    const projection = projected.get(e.id);
    if (!position || !projection || e.now_cost === null) return [];
    if (e.can_select === false && !owned.has(e.id)) return [];
    return [
      {
        id: e.id,
        name: e.web_name,
        club: e.team,
        position,
        price: e.now_cost,
        points: projection.points,
        status: e.status ?? "a",
        chance: e.chance_of_playing_next_round,
        news: e.news ?? "",
        ownership: e.selected_by_percent ?? 0,
        form: e.form ?? 0,
        penalties: e.penalties_order === 1,
        priceTrend: priceTrend(e, deadlines),
      },
    ];
  });
}

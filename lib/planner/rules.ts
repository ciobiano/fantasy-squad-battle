import type { Bootstrap } from "@/lib/fpl/schemas";
import type { Chip, Position, Rules } from "./engine/types";

// FPL's squad rules from bootstrap (game_config.rules, element_types, chips),
// so the planner follows FPL when it changes them. Any part FPL stops sending
// falls back to the 2026/27 rules below (read 19 Oct 2026).

/** Points per extra transfer: fixed by the rules, not in FPL's data. */
export const HIT_COST = 4;

const CHIPS: ReadonlySet<string> = new Set<Chip>(["wildcard", "freehit", "bboost", "3xc"]);
const POSITION_BY_NAME: Readonly<Record<string, Position>> = { GKP: "GK", DEF: "DEF", MID: "MID", FWD: "FWD" };

export const RULES_2026_27: Rules = {
  squadSize: 15,
  starters: 11,
  clubLimit: 3,
  budget: 1000,
  sellOnFee: 0.5,
  maxFreeTransfers: 5,
  transfersCap: 20,
  hitCost: HIT_COST,
  positions: {
    GK: { squad: 2, min: 1, max: 1 },
    DEF: { squad: 5, min: 3, max: 5 },
    MID: { squad: 5, min: 2, max: 5 },
    FWD: { squad: 3, min: 1, max: 3 },
  },
  chips: (["wildcard", "freehit", "bboost", "3xc"] as const).flatMap((chip) => [
    { chip, from: chip === "wildcard" || chip === "freehit" ? 2 : 1, to: 19 },
    { chip, from: 20, to: 38 },
  ]),
};

function positionsOf(bootstrap: Bootstrap): Rules["positions"] {
  const types = bootstrap.element_types ?? [];
  const read = Object.fromEntries(
    types.flatMap((t) => {
      const position = POSITION_BY_NAME[t.singular_name_short];
      return position ? [[position, { squad: t.squad_select, min: t.squad_min_play, max: t.squad_max_play }]] : [];
    }),
  );
  return Object.keys(read).length === 4 ? (read as Rules["positions"]) : RULES_2026_27.positions;
}

function chipsOf(bootstrap: Bootstrap): Rules["chips"] {
  const chips = (bootstrap.chips ?? []).flatMap((c) =>
    CHIPS.has(c.name) ? [{ chip: c.name as Chip, from: c.start_event, to: c.stop_event }] : [],
  );
  return chips.length ? chips : RULES_2026_27.chips;
}

export function rulesOf(bootstrap: Bootstrap): Rules {
  const rules = bootstrap.game_config?.rules;
  return {
    ...RULES_2026_27,
    ...(rules && {
      squadSize: rules.squad_squadsize,
      starters: rules.squad_squadplay,
      clubLimit: rules.squad_team_limit,
      budget: rules.squad_total_spend,
      sellOnFee: rules.transfers_sell_on_fee,
      maxFreeTransfers: 1 + rules.max_extra_free_transfers,
      transfersCap: rules.transfers_cap,
    }),
    positions: positionsOf(bootstrap),
    chips: chipsOf(bootstrap),
  };
}

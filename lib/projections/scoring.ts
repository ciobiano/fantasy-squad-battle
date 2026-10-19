import type { Bootstrap, GameConfig } from "@/lib/fpl/schemas";
import type { Position } from "./types";

// FPL's points table, read from bootstrap (game_config.scoring) so a rule
// change reaches the projections by itself. If FPL stops sending it, the
// 2026/27 table below stands in (read 19 Oct 2026).

export type Scoring = GameConfig["scoring"];

export const SCORING_2026_27: Scoring = {
  long_play: 2,
  short_play: 1,
  goals_scored: { GKP: 10, DEF: 6, MID: 5, FWD: 4 },
  assists: 3,
  clean_sheets: { GKP: 4, DEF: 4, MID: 1, FWD: 0 },
  goals_conceded: { GKP: -1, DEF: -1, MID: 0, FWD: 0 },
  saves: 1,
  bonus: 1,
  yellow_cards: -1,
  defensive_contribution: { GKP: 0, DEF: 2, MID: 2, FWD: 2 },
};

/** Saves per point, goals conceded per point lost: not in FPL's table, fixed by the rules. */
export const SAVES_PER_POINT = 3;
export const CONCEDED_PER_POINT = 2;

/** Defensive actions needed for the defensive-contribution points (2025/26 rules, unchanged in 2026/27). */
export const DEFENSIVE_THRESHOLD: Readonly<Record<Position, number | null>> = { GK: null, DEF: 10, MID: 12, FWD: 12 };

export const scoringOf = (bootstrap: Bootstrap): Scoring => bootstrap.game_config?.scoring ?? SCORING_2026_27;

/** The key FPL's table uses for a position. */
export const tableKey = (position: Position) => (position === "GK" ? "GKP" : position);

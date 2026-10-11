import type { GameweekStatus } from "@/lib/fpl/gameweek";

// The league views, language-free (D2): facts only. Roast lines and award
// titles are added per language afterwards (lib/roasts), so the facts on a
// card can never differ between English, Pidgin and French.

export type AwardId =
  | "oga"
  | "climber"
  | "captainDisaster"
  | "benchRegret"
  | "hitMerchant"
  | "middleClass"
  | "faller"
  | "woodenSpoon";

/** Story order after the Wrap: the Wooden Spoon comes last, as the punchline. */
export const AWARD_ORDER: readonly AwardId[] = [
  "oga",
  "climber",
  "captainDisaster",
  "benchRegret",
  "hitMerchant",
  "middleClass",
  "faller",
  "woodenSpoon",
];

export interface Manager {
  /** FPL team (entry) ID. */
  readonly id: number;
  /** First name only, never the surname. */
  readonly firstName: string;
  readonly teamName: string;
  /** True when this is the visitor's own team (they came in with their team ID). */
  readonly isYou: boolean;
}

/** A gameweek score: net = points − hits. Cards show "67 (71 −4)". */
export interface Score {
  readonly net: number;
  readonly points: number;
  readonly hits: number;
}

export interface CaptainFact {
  readonly name: string;
  /** The captain's own points this gameweek, before the armband multiplier. */
  readonly points: number;
  readonly minutes: number;
  readonly tripleCaptain: boolean;
  /** The captain didn't play and the vice-captain did, so the vice got the armband (D4). */
  readonly viceRescued: boolean;
}

export interface AwardWinner {
  readonly manager: Manager;
  /** Oga, Wooden Spoon and Hit Merchant. */
  readonly score?: Score;
  /** Captain Disaster. */
  readonly captain?: CaptainFact;
  /** Climber, Faller and Middle Class: league rank before and now. */
  readonly ranks?: { readonly from: number; readonly to: number };
}

export interface Award {
  readonly id: AwardId;
  /**
   * The headline number: the score (Oga, Wooden Spoon), the captain's points,
   * bench points, the hit cost, places climbed or dropped, or how many
   * managers are Middle Class.
   */
  readonly stat: number;
  /** Everyone who shares the award, in a stable order. Cards show 3, then "+N others". */
  readonly winners: readonly AwardWinner[];
}

export interface MarketRow {
  readonly manager: Manager;
  /** null: the manager hadn't started playing FPL by this gameweek. */
  readonly score: Score | null;
  /** Position by this gameweek's score; equal scores share a rank. */
  readonly gwRank: number | null;
  readonly leagueRank: number | null;
  /** Places moved in the league table this gameweek: + up, − down. */
  readonly leagueRankChange: number | null;
  /** Season total minus the league average, for each gameweek from 1 (null before they joined). */
  readonly gapSeries: readonly (number | null)[];
  readonly awards: readonly AwardId[];
}

export interface TableRow {
  readonly manager: Manager;
  readonly rank: number | null;
  readonly lastRank: number | null;
  /** lastRank − rank: + up, − down. */
  readonly movement: number | null;
  readonly total: number | null;
  readonly gwScore: Score | null;
}

export interface TeamOfTheWeekPlayer {
  readonly id: number;
  readonly name: string;
  readonly club: string;
  readonly position: "GK" | "DEF" | "MID" | "FWD";
  readonly points: number;
  /** How many managers in the league have this player in their squad. */
  readonly ownedBy: number;
}

export interface TeamOfTheWeek {
  readonly players: readonly TeamOfTheWeekPlayer[];
  readonly topPlayer: { readonly name: string; readonly points: number } | null;
}

export interface LeagueView {
  readonly league: { readonly id: number; readonly name: string };
  readonly gameweek: { readonly id: number; readonly status: GameweekStatus; readonly provisional: boolean };
  /** The league has more than 50 managers; only the top 50 are covered. */
  readonly truncated: boolean;
  /** Average net gameweek score: in this league, and across all of FPL. */
  readonly averages: { readonly league: number | null; readonly fpl: number };
  /** Awarded only, in AWARD_ORDER. */
  readonly awards: readonly Award[];
  /** Awards nobody qualified for. The Wrap gets a group line for each instead. */
  readonly skipped: readonly AwardId[];
  /** Sorted by this gameweek's score. */
  readonly market: readonly MarketRow[];
  /** Sorted by league rank. */
  readonly table: readonly TableRow[];
  readonly teamOfTheWeek: TeamOfTheWeek;
}

// The view model a share card renders from. The award logic (lib/league, data
// session) produces facts; lib/cards turns them into words, numbers and shapes.
// Keep this free of FPL API shapes.
import type { AwardKey } from "@/lib/awards";
import type { Lang } from "@/lib/i18n";
import type { BadgeShape } from "@/lib/ui/badge";

export type CardFormat = "status" | "x";
export type CardTheme = "dark" | "light";

export interface Manager {
  /** First name only, never the surname. */
  readonly firstName: string;
  readonly teamName: string;
  readonly badge: { readonly initials: string; readonly colour: string; readonly shape: BadgeShape };
}

export interface CardMeta {
  readonly leagueName: string;
  readonly gw: number;
  /** True until every fixture of the gameweek is final. */
  readonly provisional: boolean;
}

/** The facts behind each award: what the card shows, before any wording. */
export type AwardFacts =
  | {
      readonly award: "oga" | "spoon";
      /** Net GW score (points − hits) and the hits taken. */
      readonly net: number;
      readonly hits: number;
      /** Season total minus the league average after each GW so far, oldest first; empty draws no chart. */
      readonly gapByGw: readonly number[];
    }
  | {
      readonly award: "climber" | "faller";
      /** Places moved this GW (positive). Ties share the same move. */
      readonly places: number;
      /** For a single winner: rank before and after. */
      readonly from: number;
      readonly to: number;
      /** League rank after each GW, oldest first, one series per winner. */
      readonly rankByGw: readonly (readonly number[])[];
      readonly leagueSize: number;
    }
  | {
      readonly award: "middle";
      /** Places moved over the window (always ≤ 1). */
      readonly places: number;
      readonly weeks: number;
      readonly rankByGw: readonly (readonly number[])[];
      readonly leagueSize: number;
    }
  | {
      readonly award: "captain";
      /** name: null when the winners captained different players (no name, no bars). */
      readonly captain: { readonly name: string | null; readonly points: number };
      /**
       * What the captain is set against: the best player in the manager's team,
       * or the gameweek's top player when the team's isn't known. null: no bars.
       */
      readonly best: { readonly name: string; readonly points: number; readonly scope: "team" | "gameweek" } | null;
    }
  | {
      readonly award: "bench";
      readonly total: number;
      /** The benched players and their points; empty draws no tiles. */
      readonly players: readonly { readonly name: string; readonly points: number }[];
    }
  | {
      readonly award: "hits";
      /** Points scored before hits (null when the winners' differ: no bar), and hit points paid. */
      readonly gross: number | null;
      readonly paid: number;
    };

export interface AwardCardModel {
  readonly meta: CardMeta;
  /** Up to three winners are named; the rest are counted. */
  readonly winners: readonly Manager[];
  readonly facts: AwardFacts;
  /** Already picked by the league + GW + award seed (lib/roasts). */
  readonly roast: string;
}

export interface WrapRow {
  readonly award: AwardKey;
  /** First names of the winners; empty when nobody won. */
  readonly winners: readonly string[];
  /** The headline number, e.g. "92", "3", "−12"; null when nobody won. */
  readonly value: string | null;
  /** Rank movement: drawn as a triangle on a green or red pill before the value. */
  readonly movement?: "up" | "down";
  /** Shown instead of names when nobody won ("Nobody take hit this week."). */
  readonly groupLine?: string;
}

export interface WrapCardModel {
  readonly meta: CardMeta;
  readonly leagueAverage: number;
  readonly rows: readonly WrapRow[];
}

export interface CardOptions {
  readonly format: CardFormat;
  readonly theme: CardTheme;
  readonly lang: Lang;
  /**
   * Shown in the app (story viewer, share page): no grain. The grain is noise,
   * slow to draw and impossible to compress, and invisible at phone size.
   * Shared and saved images keep it.
   */
  readonly preview: boolean;
}

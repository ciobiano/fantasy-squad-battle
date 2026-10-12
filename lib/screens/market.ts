// The League tab's Market view, in the shapes of docs/design/brief.md §5.
// lib/league (data session) will produce MarketRow and TeamOfTheWeek; until
// then the sample league from the design canvas fills them.
import { AWARD_KEYS, type AwardKey } from "@/lib/cards/types";
import { badgeFor, type Badge } from "@/lib/ui/badge";

export interface Score {
  /** points − hits */
  readonly net: number;
  readonly points: number;
  readonly hits: number;
}

export interface MarketRow {
  readonly manager: { readonly id: number; readonly firstName: string; readonly teamName: string };
  readonly score: Score;
  /** + up, − down in the league table this GW. */
  readonly leagueRankChange: number;
  /** Season total minus the league average, per GW. */
  readonly gapSeries: readonly number[];
  readonly awards: readonly AwardKey[];
}

export interface TeamOfTheWeek {
  /** Goalkeeper line first, as FPL shows it. */
  readonly lines: readonly (readonly { readonly name: string; readonly points: number; readonly ownedBy: number; readonly top: boolean }[])[];
}

export interface MarketView {
  readonly leagueId: string;
  readonly leagueName: string;
  readonly gw: number;
  readonly provisional: boolean;
  /** Awards with a winner, in story order. */
  readonly awards: readonly AwardKey[];
  readonly teamOfTheWeek: TeamOfTheWeek;
  readonly rows: readonly MarketRow[];
}

export interface Spark {
  readonly points: string;
  readonly baseY: number;
  readonly direction: "up" | "down";
}

/** A row's sparkline: the gap to the league average per GW, around a dashed zero line. */
export function spark(gaps: readonly number[], width = 72, height = 32): Spark {
  const values = gaps.length > 1 ? gaps : [0, ...gaps];
  const baseY = height / 2;
  const reach = Math.max(1, ...values.map(Math.abs));
  const scale = (height / 2 - 2) / reach;
  const step = (width - 4) / (values.length - 1);
  const points = values.map((g, i) => `${(2 + i * step).toFixed(1)},${(baseY - g * scale).toFixed(1)}`).join(" ");
  return { points, baseY, direction: (values.at(-1) ?? 0) >= 0 ? "up" : "down" };
}

export const badgeOf = (row: MarketRow): Badge => badgeFor(row.manager.teamName);

/** The one emoji a row shows: its first award in story order. */
export function rowAward(row: MarketRow): AwardKey | null {
  return AWARD_KEYS.find((key) => row.awards.includes(key)) ?? null;
}

const m = (id: number, firstName: string, teamName: string) => ({ id, firstName, teamName });
const r = (manager: MarketRow["manager"], points: number, hits: number, change: number, gaps: number[], awards: AwardKey[]): MarketRow => ({
  manager,
  score: { net: points - hits, points, hits },
  leagueRankChange: change,
  gapSeries: gaps,
  awards,
});
const p = (name: string, points: number, ownedBy = 0, top = false) => ({ name, points, ownedBy, top });

/** The design canvas's sample league (real GW 5 players), ranked by net GW score. */
export const SAMPLE_MARKET: MarketView = {
  leagueId: "sample",
  leagueName: "Ikeja Banter League",
  gw: 5,
  provisional: false,
  awards: ["oga", "climber", "captain", "bench", "hits", "middle", "faller", "spoon"],
  teamOfTheWeek: {
    lines: [
      [p("Rushworth", 11)],
      [p("Dasilva", 15), p("Schuster", 14), p("Tarkowski", 14, 1), p("Hall", 13, 2)],
      [p("Semenyo", 17, 3), p("Groß", 14, 6), p("Manzambi", 13), p("Buendía", 12)],
      [p("Brobbey", 17, 1, true), p("Kostoulas", 10)],
    ],
  },
  rows: [
    r(m(1, "Kemi", "No Gree For Anybody"), 96, 4, 2, [3, 10, 7, 9, 49], ["oga"]),
    r(m(2, "Amaka", "Jollof United"), 71, 0, 3, [-11, -22, -29, -33, -14], ["climber"]),
    r(m(3, "Tobi", "Chop Life FC"), 64, 0, 1, [10, 21, 27, 38, 50], []),
    r(m(4, "Ngozi", "Odogwu XI"), 55, 0, 0, [0, 2, 0, 0, 3], ["middle"]),
    r(m(5, "Femi", "Japa City"), 58, 4, -2, [13, 27, 37, 46, 48], ["faller"]),
    r(m(6, "Seun", "Eze Does It"), 52, 0, 1, [-2, -3, -3, -5, -5], ["middle"]),
    r(m(7, "Ibrahim", "Wahala Wanderers"), 49, 0, 1, [-5, -7, -7, -10, -13], ["middle"]),
    r(m(8, "Emeka", "Agbero Athletic"), 45, 0, -1, [-5, -10, -16, -23, -30], ["bench"]),
    r(m(9, "Aïcha", "Les Lions de Douala"), 44, 0, -1, [-7, -14, -11, -15, -23], []),
    r(m(10, "Bayo", "Mbeumo Jumbo"), 38, 0, -2, [6, 3, -1, 0, -14], ["captain", "faller"]),
    r(m(11, "Yemi", "Cole Palmer Wine"), 47, 12, -1, [8, 11, 17, 22, 5], ["hits"]),
    r(m(12, "Chidi", "Danfo Rovers"), 31, 4, -1, [-8, -17, -22, -32, -57], ["spoon"]),
  ],
};

// Turns an award's facts into the card's text: the big number, its note and
// the chart message. The facts are the same in every language (league decision
// D2); the words come from lib/i18n.
import { copyFor, type Lang } from "@/lib/i18n";
import type { AwardFacts } from "./types";

export const WATERMARK = "fantasysquadbattle.vercel.app";

/** 1st, 2nd, 3rd, 11th… in English and Pidgin; 1er, 2e… in French. */
export function ordinal(n: number, lang: Lang): string {
  if (lang === "fr") return n === 1 ? "1er" : `${n}e`;
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

/** A minus sign, not a hyphen, so negative numbers read as numbers. */
export const signed = (n: number): string => (n < 0 ? `−${Math.abs(n)}` : String(n));

/** Decimal in the language's style: 52.2 or 52,2. */
export const decimal = (n: number, lang: Lang): string => {
  const text = n.toFixed(1);
  return lang === "fr" ? text.replace(".", ",") : text;
};

export interface Described {
  /** The big number. */
  readonly value: string;
  /** Movement is drawn as a triangle beside the number (Inter's card subsets have no ▲ ▼). */
  readonly arrow?: "up" | "down";
  /** One line of context beside it, or "" for none. */
  readonly note: string;
  /** The chart's one message line, when the award has one. */
  readonly message: string;
}

/** The big number, its context and the chart message for one award. */
export function describe(facts: AwardFacts, winnerCount: number, lang: Lang): Described {
  const l = copyFor(lang).card;
  switch (facts.award) {
    case "oga":
    case "spoon": {
      const gap = facts.gapByGw.at(-1) ?? 0;
      return {
        value: signed(facts.net),
        note: facts.hits > 0 ? `(${facts.net + facts.hits} −${facts.hits})` : "",
        message: gap >= 0 ? l.above(Math.round(gap)) : l.below(Math.round(-gap)),
      };
    }
    case "climber":
    case "faller":
      return {
        value: String(facts.places),
        arrow: facts.award === "climber" ? "up" : "down",
        note: winnerCount > 1 ? l.placesEach : `${ordinal(facts.from, lang)} → ${ordinal(facts.to, lang)}`,
        message: "",
      };
    case "middle":
      return { value: `±${facts.places}`, note: l.inWeeks(facts.weeks), message: "" };
    case "captain":
      return { value: String(facts.captain.points), note: `${facts.captain.name} (C)`, message: "" };
    case "bench":
      return { value: String(facts.total), note: l.onBench, message: "" };
    case "hits":
      return { value: signed(-facts.paid), note: l.inHits, message: "" };
  }
}

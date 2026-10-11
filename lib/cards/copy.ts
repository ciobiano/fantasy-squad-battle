// Words on the cards, per language. The facts are the same in every language
// (league decision D2); only titles and labels change. French is beta until a
// native speaker reviews it.
import type { AwardFacts, AwardKey, Lang } from "./types";

export const WATERMARK = "fantasysquadbattle.vercel.app";

export const AWARD_EMOJI: Record<AwardKey, string> = {
  oga: "👑",
  climber: "📈",
  captain: "🫠",
  bench: "🪑",
  hits: "💸",
  middle: "🛋️",
  faller: "📉",
  spoon: "🥄",
};

const TITLES: Record<Lang, Record<AwardKey, string>> = {
  pcm: {
    oga: "Oga of the Week", climber: "Biggest Climber", captain: "Captain Wahala", bench: "Bench Regret",
    hits: "Hit Merchant", middle: "Middle Class", faller: "Biggest Faller", spoon: "Wooden Spoon",
  },
  en: {
    oga: "Oga of the Week", climber: "Biggest Climber", captain: "Captain Disaster", bench: "Bench Regret",
    hits: "Hit Merchant", middle: "Middle Class", faller: "Biggest Faller", spoon: "Wooden Spoon",
  },
  fr: {
    oga: "Patron de la semaine", climber: "Plus belle remontée", captain: "Capitaine catastrophe", bench: "Regret du banc",
    hits: "Marchand de −4", middle: "Classe moyenne", faller: "Grosse chute", spoon: "Cuillère de bois",
  },
};

interface Labels {
  readonly gw: (gw: number) => string;
  readonly wrapTitle: (gw: number) => string;
  readonly provisional: string;
  readonly leagueAverage: string;
  readonly onBench: string;
  readonly inHits: string;
  readonly inWeeks: (weeks: number) => string;
  readonly placesEach: string;
  readonly above: (points: number) => string;
  readonly below: (points: number) => string;
  readonly captain: (name: string) => string;
  readonly best: (name: string) => string;
  readonly kept: string;
  readonly paid: string;
  readonly others: (count: number) => string;
}

const LABELS: Record<Lang, Labels> = {
  pcm: {
    gw: (gw) => `GW ${gw}`,
    wrapTitle: (gw) => `GW ${gw} Wrapped`,
    provisional: "Provisional",
    leagueAverage: "League average",
    onBench: "points for bench",
    inHits: "points for hits",
    inWeeks: (weeks) => `place in ${weeks} weeks`,
    placesEach: "places each",
    above: (points) => `${points} pass league average`,
    below: (points) => `${points} under league average`,
    captain: (name) => `Captain · ${name}`,
    best: (name) => `Best for team · ${name}`,
    kept: "kept",
    paid: "paid",
    others: (count) => `+${count} others`,
  },
  en: {
    gw: (gw) => `GW ${gw}`,
    wrapTitle: (gw) => `GW ${gw} Wrapped`,
    provisional: "Provisional",
    leagueAverage: "League average",
    onBench: "points on the bench",
    inHits: "points in hits",
    inWeeks: (weeks) => `place in ${weeks} weeks`,
    placesEach: "places each",
    above: (points) => `${points} above the league average`,
    below: (points) => `${points} below the league average`,
    captain: (name) => `Captain · ${name}`,
    best: (name) => `Best in team · ${name}`,
    kept: "kept",
    paid: "paid",
    others: (count) => `+${count} others`,
  },
  fr: {
    gw: (gw) => `J${gw}`,
    wrapTitle: (gw) => `Récap J${gw}`,
    provisional: "Provisoire",
    leagueAverage: "Moyenne de la ligue",
    onBench: "points sur le banc",
    inHits: "points de pénalité",
    inWeeks: (weeks) => `place en ${weeks} semaines`,
    placesEach: "places chacun",
    above: (points) => `${points} au-dessus de la moyenne`,
    below: (points) => `${points} sous la moyenne`,
    captain: (name) => `Capitaine · ${name}`,
    best: (name) => `Meilleur de l’équipe · ${name}`,
    kept: "gardés",
    paid: "payés",
    others: (count) => `+${count} autres`,
  },
};

export const title = (award: AwardKey, lang: Lang): string => TITLES[lang][award];
export const labels = (lang: Lang): Labels => LABELS[lang];

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
  const l = labels(lang);
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

import type { Lang } from "./book";

// Small text helpers for filling roast templates: numbers with their unit,
// ordinals, lists of names, the seeded pick and the fill itself.

export type Vars = Readonly<Record<string, string>>;

const plurals: Record<Lang, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  pcm: new Intl.PluralRules("en"),
  fr: new Intl.PluralRules("fr"),
};

const UNITS = { point: ["point", "points"], place: ["place", "places"] } as const;

/** "1 point", "8 points"; French also says "0 point". */
export function unit(n: number, kind: keyof typeof UNITS, lang: Lang): string {
  const [one, other] = UNITS[kind];
  return `${n} ${plurals[lang].select(n) === "one" ? one : other}`;
}

/** 1st, 2nd, 3rd, 11th in English and Pidgin; 1er, 2e in French. */
export function ordinal(n: number, lang: Lang): string {
  if (lang === "fr") return n === 1 ? "1er" : `${n}e`;
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
}

/** A minus sign, not a hyphen, as on the cards. */
export const signed = (n: number): string => (n < 0 ? `−${Math.abs(n)}` : String(n));

// Pidgin lists like British English ("Kim, Dave and Tunde"); CLDR's Pidgin says "an".
const lists: Record<Lang, Intl.ListFormat> = {
  en: new Intl.ListFormat("en-GB", { type: "conjunction" }),
  pcm: new Intl.ListFormat("en-GB", { type: "conjunction" }),
  fr: new Intl.ListFormat("fr", { type: "conjunction" }),
};

export const nameList = (names: readonly string[], lang: Lang): string => lists[lang].format(names);

/** FNV-1a: a stable index for a key, so the same card always gets the same line. */
export function seedIndex(key: string, size: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % size;
}

/** Fills {placeholders}; null if the template asks for one this situation doesn't have. */
export function fill(template: string, vars: Vars): string | null {
  let missing = false;
  const filled = template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (Object.hasOwn(vars, key)) return vars[key];
    missing = true;
    return "";
  });
  return missing ? null : filled;
}

/**
 * The seeded line, filled. A line with a wrong placeholder is skipped for the
 * next one in the pool, so a typo in an edit costs one line, not the card.
 */
export function pickLine(lines: readonly string[], key: string, vars: Vars): string | null {
  if (!lines.length) return null;
  const start = seedIndex(key, lines.length);
  for (let i = 0; i < lines.length; i++) {
    const template = lines[(start + i) % lines.length];
    const filled = fill(template, vars);
    if (filled !== null) return filled;
    console.warn(`[roasts] skipped a line with an unknown placeholder: ${template}`);
  }
  return null;
}

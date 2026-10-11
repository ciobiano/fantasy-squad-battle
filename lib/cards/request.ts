// Reads a card request's path and query into checked values. Unknown values
// fall back to the defaults; an unknown award is rejected by the caller.
import { AWARD_KEYS, type AwardKey, type CardFormat, type CardOptions, type CardTheme, type Lang } from "./types";

const FORMATS: readonly CardFormat[] = ["status", "x"];
const THEMES: readonly CardTheme[] = ["dark", "light"];
const LANGS: readonly Lang[] = ["pcm", "en", "fr"];

const pick = <T extends string>(allowed: readonly T[], value: string | null, fallback: T): T =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export function cardOptions(query: URLSearchParams): CardOptions {
  return {
    format: pick(FORMATS, query.get("format"), "status"),
    theme: pick(THEMES, query.get("theme"), "dark"),
    lang: pick(LANGS, query.get("lang"), "pcm"),
  };
}

export type CardKind = { readonly kind: "wrap" } | { readonly kind: "award"; readonly award: AwardKey };

export function cardKind(segment: string): CardKind | null {
  if (segment === "wrap") return { kind: "wrap" };
  return (AWARD_KEYS as readonly string[]).includes(segment) ? { kind: "award", award: segment as AwardKey } : null;
}

/** A gameweek number from the path: 1–38, digits only. */
export function gameweek(segment: string): number | null {
  if (!/^\d{1,2}$/.test(segment)) return null;
  const gw = Number(segment);
  return gw >= 1 && gw <= 38 ? gw : null;
}

/** Final gameweeks change rarely (a roast edit); provisional ones change with the scores. */
export const cacheControl = (provisional: boolean): string =>
  provisional
    ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

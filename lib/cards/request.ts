// Reads a card request (/cards/{league}/{gw}/{wrap|award}?format&theme&lang&provisional)
// into checked values. Unknown options fall back to the defaults; an unknown
// gameweek or award means there's no such card.
import { AWARD_KEYS, type AwardKey } from "@/lib/awards";
import { LANGS } from "@/lib/i18n";
import type { CardFormat, CardOptions, CardTheme } from "./types";

const FORMATS: readonly CardFormat[] = ["status", "x"];
const THEMES: readonly CardTheme[] = ["dark", "light"];

const pick = <T extends string>(allowed: readonly T[], value: string | null, fallback: T): T =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

function cardOptions(query: URLSearchParams): CardOptions {
  return {
    format: pick(FORMATS, query.get("format"), "status"),
    theme: pick(THEMES, query.get("theme"), "dark"),
    lang: pick(LANGS, query.get("lang"), "pcm"),
  };
}

export type CardKind = { readonly kind: "wrap" } | { readonly kind: "award"; readonly award: AwardKey };

function cardKind(segment: string): CardKind | null {
  if (segment === "wrap") return { kind: "wrap" };
  return (AWARD_KEYS as readonly string[]).includes(segment) ? { kind: "award", award: segment as AwardKey } : null;
}

/** A gameweek number from the path: 1–38, digits only. */
function gameweek(segment: string): number | null {
  if (!/^\d{1,2}$/.test(segment)) return null;
  const gw = Number(segment);
  return gw >= 1 && gw <= 38 ? gw : null;
}

export interface CardRequest {
  /** The league segment as given: an ID or "sample"; the loader checks it. */
  readonly league: string;
  readonly gw: number;
  readonly kind: CardKind;
  readonly options: CardOptions;
  /** ?provisional=1 previews the provisional tag on sample cards; real cards take it from the gameweek. */
  readonly provisional: boolean;
}

export function cardRequest(
  params: { readonly league: string; readonly gw: string; readonly award: string },
  query: URLSearchParams,
): CardRequest | null {
  const gw = gameweek(params.gw);
  const kind = cardKind(params.award);
  if (gw === null || kind === null) return null;
  return { league: params.league, gw, kind, options: cardOptions(query), provisional: query.get("provisional") === "1" };
}

/** Final gameweeks change rarely (a roast edit); provisional ones change with the scores. */
export const cacheControl = (provisional: boolean): string =>
  provisional
    ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

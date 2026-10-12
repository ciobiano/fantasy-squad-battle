// Which language the app speaks, and safe redirects back to where someone was.
// The choice lives in a cookie so server-rendered screens can use it; until
// someone picks, French phones get French and everyone else gets Pidgin.
import type { Lang } from "@/lib/cards/types";

export const LANG_COOKIE = "fsb-lang";
export const LANGS: readonly Lang[] = ["pcm", "en", "fr"];

export const isLang = (value: unknown): value is Lang => typeof value === "string" && (LANGS as readonly string[]).includes(value);

/** The saved choice, else the phone's first language: French → fr, anything else → Pidgin. */
export function resolveLang(saved: string | undefined, acceptLanguage: string | null): Lang {
  if (isLang(saved)) return saved;
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first === "fr" || first.startsWith("fr-") ? "fr" : "pcm";
}

/**
 * A path on this site to send someone back to, or "/". Refuses anything that
 * could leave the site ("//evil.example", "/\\evil", full URLs).
 */
export function safeBackPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

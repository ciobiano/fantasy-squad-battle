// Small formatting rules shared by the app screens.
import type { Lang } from "@/lib/i18n";

/** Ranks over 99,999 shorten (412K, 1.2M); smaller ones keep their separators. */
export function compactRank(rank: number): string {
  if (rank >= 1_000_000) return `${(rank / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (rank >= 100_000) return `${Math.round(rank / 1000)}K`;
  return rank.toLocaleString("en-GB");
}

export interface Movement {
  readonly direction: "up" | "down" | "none";
  /** Places moved, always positive; 0 when nothing moved. */
  readonly places: number;
}

/** Rank movement from last rank to this rank (a smaller rank is better). Unknown ranks count as no move. */
export function movement(rank: number | null, lastRank: number | null): Movement {
  if (rank === null || lastRank === null || rank === lastRank) return { direction: "none", places: 0 };
  return rank < lastRank ? { direction: "up", places: lastRank - rank } : { direction: "down", places: rank - lastRank };
}

/** Movement from a change in places: positive is up. */
export function movedBy(change: number): Movement {
  if (change === 0) return { direction: "none", places: 0 };
  return change > 0 ? { direction: "up", places: change } : { direction: "down", places: -change };
}

/** "14h", "2d": how long ago a report came in, from ISO time to now. */
export function age(isoTime: string, now: number): string {
  const ms = Math.max(0, now - Date.parse(isoTime));
  const hours = Math.floor(ms / 3_600_000);
  return hours < 24 ? `${Math.max(1, hours)}h` : `${Math.floor(hours / 24)}d`;
}

/** One decimal place, the way each language writes it: "53.7", or "53,7" in French. */
export function decimal(value: number, lang: Lang): string {
  const text = value.toFixed(1);
  return lang === "fr" ? text.replace(".", ",") : text;
}

/** FPL money (tenths of a million): "£1.7m", or "1,7 M£" in French. */
export function money(tenths: number, lang: Lang): string {
  const millions = decimal(tenths / 10, lang);
  return lang === "fr" ? `${millions} M£` : `£${millions}m`;
}

/** A points change with its sign: "+9.7", "−4.0" (a real minus sign). */
export const signedDecimal = (value: number, lang: Lang): string => `${value < 0 ? "−" : "+"}${decimal(Math.abs(value), lang)}`;

/** FPL deadlines in West Africa Time, where most of our players are: "Fri 23 Oct, 18:30", "ven. 23 oct., 18:30". */
export function deadlineText(iso: string, lang: Lang): string {
  const when = new Date(iso);
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  const zone = { timeZone: "Africa/Lagos" } as const;
  const day = when.toLocaleDateString(locale, { ...zone, weekday: "short", day: "numeric", month: "short" });
  const time = when.toLocaleTimeString(locale, { ...zone, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day.replace(/,/g, "")}, ${time}`;
}


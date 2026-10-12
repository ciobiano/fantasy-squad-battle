// Small formatting rules shared by the app screens.

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

/** "14h", "2d": how long ago a report came in, from ISO time to now. */
export function age(isoTime: string, now: number): string {
  const ms = Math.max(0, now - Date.parse(isoTime));
  const hours = Math.floor(ms / 3_600_000);
  return hours < 24 ? `${Math.max(1, hours)}h` : `${Math.floor(hours / 24)}d`;
}

/** First word of a full name: surnames are never shown. */
export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? "";

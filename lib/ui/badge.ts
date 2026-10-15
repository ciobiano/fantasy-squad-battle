// Generated team badges: initials in a shape, coloured from the team name.
// No crests. The same team always gets the same badge, everywhere.
export type BadgeShape = "circle" | "squircle" | "shield";
export type BadgeColour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Badge {
  readonly initials: string;
  readonly colour: BadgeColour;
  readonly shape: BadgeShape;
}

const SHAPES: readonly BadgeShape[] = ["circle", "squircle", "shield"];

/** A small stable hash (FNV-1a) so badges don't change between visits. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (const char of text) {
    h ^= char.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Up to two letters from the first two words that start with a letter or digit. */
export function initials(teamName: string): string {
  const words = teamName.trim().split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w));
  const letters = words.slice(0, 2).map((w) => Array.from(w)[0] ?? "");
  const text = letters.join("") || Array.from(teamName.trim())[0] || "?";
  return text.toUpperCase();
}

export function badgeFor(teamName: string): Badge {
  const h = hash(teamName.trim().toLowerCase());
  return { initials: initials(teamName), colour: ((h % 8) + 1) as BadgeColour, shape: SHAPES[(h >>> 3) % SHAPES.length] };
}

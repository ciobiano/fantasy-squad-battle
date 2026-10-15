// The awards, by key, in story order: Wrap plays first, then these, with the
// Wooden Spoon last as the punchline. Words for each live in lib/i18n; the
// facts behind each live with the award logic.

export const AWARD_KEYS = ["oga", "climber", "captain", "bench", "hits", "middle", "faller", "spoon"] as const;
export type AwardKey = (typeof AWARD_KEYS)[number];

export const isAwardKey = (value: unknown): value is AwardKey =>
  typeof value === "string" && (AWARD_KEYS as readonly string[]).includes(value);

/** Each award's Noto emoji (file emoji_u{code}.svg in assets/emoji and public/emoji): 👑 📈 🫠 🪑 💸 🛋️ 📉 🥄 */
export const AWARD_EMOJI_CODE: Readonly<Record<AwardKey, string>> = {
  oga: "1f451",
  climber: "1f4c8",
  captain: "1fae0",
  bench: "1fa91",
  hits: "1f4b8",
  middle: "1f6cb",
  faller: "1f4c9",
  spoon: "1f944",
};

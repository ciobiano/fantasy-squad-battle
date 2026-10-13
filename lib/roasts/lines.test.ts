import { describe, expect, it } from "vitest";
import { AWARD_ORDER } from "@/lib/league/types";
import type { Lang, Pool, RoastBook } from "./book";
import { en } from "./lines/en";
import { fr } from "./lines/fr";
import { pcm } from "./lines/pcm";
import { poolFor, varsFor } from "./select";
import { fill } from "./text";
import { sampleAward } from "./testing";

// Checks every line in every language: it fills with the placeholders its pool
// gets, fits the card, and stays inside the guardrails.

const BOOKS: [Lang, RoastBook][] = [
  ["pcm", pcm],
  ["en", en],
  ["fr", fr],
];

/** A filled line must fit about four lines on the card. */
const MAX_LENGTH = 100;

const WINNER_POOLS = new Set<Pool>(["one", "few", "crowd", "newLeader", "fromTop", "noShow", "rescued", "triple", "sameCaptain", "paid"]);

/** Appearance, tribe, religion and family are off limits; so is naming FPL or the Premier League on a card. */
const BANNED = [
  "ugly", "fat", "mother", "mama", "mum", "father", "papa", "wife", "husband", "sister", "brother", "family",
  "tribe", "igbo", "yoruba", "hausa", "muslim", "christian", "church", "mosque", "god", "allah", "jesus",
  "pray", "prayer", "juju", "witch", "village people", "pastor", "imam", "cursed",
  "stupid", "idiot", "mumu", "olodo", "werey", "ashawo",
  "moche", "gros", "grosse", "mère", "père", "femme", "mari", "sœur", "frère", "famille", "tribu", "dieu",
  "église", "mosquée", "prière", "sorcier", "débile", "con", "fpl", "premier league",
];
const bannedIn = (line: string) =>
  BANNED.filter((word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "iu").test(line));

const entries = (book: RoastBook) =>
  AWARD_ORDER.flatMap((id) =>
    Object.entries(book[id] as Readonly<Record<string, readonly string[]>>).map(([pool, lines]) => ({
      id,
      pool: pool as Pool,
      lines,
    })),
  );

describe.each(BOOKS)("%s lines", (_lang, book) => {
  const lang = _lang;

  it.each(entries(book).map((e) => [`${e.id}.${e.pool}`, e] as const))("%s fill, fit and differ", (_, { id, pool, lines }) => {
    expect(lines.length).toBeGreaterThan(0);
    expect(new Set(lines).size).toBe(lines.length);
    const vars = WINNER_POOLS.has(pool)
      ? varsFor(sampleAward(id, pool), pool, lang, 38)
      : { gw: "38" };
    if (WINNER_POOLS.has(pool)) expect(poolFor(sampleAward(id, pool))).toBe(pool);
    for (const line of lines) {
      const filled = fill(line, vars);
      expect(filled, line).not.toBeNull();
      expect(filled!.length, filled!).toBeLessThanOrEqual(MAX_LENGTH);
    }
  });

  it("stay inside the guardrails", () => {
    const lines = entries(book).flatMap((e) => e.lines);
    expect(lines.filter((line) => bannedIn(line).length)).toEqual([]);
    // Typographic apostrophes, as on the rest of the cards.
    expect(lines.filter((line) => line.includes("'"))).toEqual([]);
  });

  it("give about six solo lines per award", () => {
    for (const id of AWARD_ORDER) expect((book[id] as Record<string, readonly string[]>).one.length, id).toBeGreaterThanOrEqual(6);
  });
});

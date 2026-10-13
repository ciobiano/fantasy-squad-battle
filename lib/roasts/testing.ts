import type { Award, AwardId, AwardWinner, CaptainFact } from "@/lib/league/types";
import type { Pool } from "./book";

// Test helper: an award that lands in a given pool, with the longest names and
// numbers a card can meet, so line tests check both the fill and the length.

const FIRST_NAMES = ["Oluwaseyifunmi", "Chukwuemekaaa", "Oluwadamilare"];
const TEAM = "Agbero Athletic FC 1"; // FPL's 20-character limit
const CAPTAIN = "Williams-Barnett";

const manager = (i: number) => ({
  id: i + 1,
  firstName: FIRST_NAMES[i % FIRST_NAMES.length],
  teamName: TEAM,
  isYou: false,
});

const captain = (fact: Partial<CaptainFact> = {}, name = CAPTAIN): CaptainFact => ({
  name,
  points: 2,
  minutes: 90,
  tripleCaptain: false,
  viceRescued: false,
  ...fact,
});

/** How many winners each group pool needs. */
const SIZE: Partial<Record<Pool, number>> = { few: 3, crowd: 42, sameCaptain: 42 };

function winner(id: AwardId, pool: Pool, i: number): AwardWinner {
  const m = manager(i);
  switch (id) {
    case "oga":
      return { manager: m, score: { net: 128, points: 128, hits: 0 } };
    case "spoon":
      return pool === "paid"
        ? { manager: m, score: { net: -14, points: 2, hits: 16 } }
        : { manager: m, score: { net: -12, points: -12, hits: 0 } };
    case "hits":
      return { manager: m, score: { net: 96, points: 112, hits: 16 } };
    case "climber":
      return { manager: m, ranks: pool === "newLeader" ? { from: 12, to: 1 } : { from: 48, to: 36 } };
    case "faller":
      return { manager: m, ranks: pool === "fromTop" ? { from: 1, to: 13 } : { from: 36, to: 48 } };
    case "middle":
      return { manager: m, ranks: { from: 24, to: 25 } };
    case "bench":
      return { manager: m };
    case "captain": {
      // Group pools other than sameCaptain need different captains.
      const name = pool === "few" || pool === "crowd" ? `${CAPTAIN.slice(0, 14)}${i}` : CAPTAIN;
      if (pool === "noShow") return { manager: m, captain: captain({ points: 0, minutes: 0 }) };
      if (pool === "rescued") return { manager: m, captain: captain({ points: 0, minutes: 0, viceRescued: true }) };
      if (pool === "triple") return { manager: m, captain: captain({ tripleCaptain: true }) };
      return { manager: m, captain: captain({}, name) };
    }
  }
}

const STAT: Record<AwardId, number> = {
  oga: 128,
  spoon: -12,
  hits: 16,
  climber: 12,
  faller: 12,
  middle: 3,
  bench: 34,
  captain: 2,
};

export function sampleAward(id: AwardId, pool: Pool): Award {
  const count = SIZE[pool] ?? 1;
  const winners = Array.from({ length: count }, (_, i) => winner(id, pool, i));
  const stat = id === "spoon" && pool === "paid" ? -14 : id === "middle" ? count : STAT[id];
  return { id, stat, winners };
}

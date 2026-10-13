import { describe, expect, it, vi } from "vitest";
import { buildLeagueView } from "@/lib/league/league-view";
import { makeBundle, player } from "@/lib/league/testing";
import { groupLineFor, roastFor, roastView } from "./index";
import { NAMED_MAX, poolFor, skippedPool } from "./select";
import { fill, nameList, ordinal, pickLine, unit } from "./text";
import { sampleAward } from "./testing";

describe("which lines fit the facts", () => {
  it("names up to 3 winners, then speaks to the crowd", () => {
    const sized = (n: number) => ({ ...sampleAward("bench", "crowd"), winners: sampleAward("bench", "crowd").winners.slice(0, n) });
    expect(poolFor(sized(1))).toBe("one");
    expect(poolFor(sized(2))).toBe("few");
    expect(poolFor(sized(NAMED_MAX))).toBe("few");
    expect(poolFor(sized(NAMED_MAX + 1))).toBe("crowd");
  });

  it("roasts one shared captain together, however many picked him", () => {
    const shared = sampleAward("captain", "sameCaptain");
    expect(poolFor({ ...shared, winners: shared.winners.slice(0, 2) })).toBe("sameCaptain");
    expect(poolFor(shared)).toBe("sameCaptain");
    expect(poolFor(sampleAward("captain", "crowd"))).toBe("crowd");
  });

  it("picks the captain's story: didn't play, rescued by the vice, Triple Captain", () => {
    const one = sampleAward("captain", "one");
    const as = (captain: object) => ({ ...one, winners: [{ ...one.winners[0], captain: { ...one.winners[0].captain!, ...captain } }] });
    expect(poolFor(as({ minutes: 0 }))).toBe("noShow");
    expect(poolFor(as({ minutes: 0, viceRescued: true }))).toBe("rescued");
    expect(poolFor(as({ tripleCaptain: true }))).toBe("triple");
    // A Triple Captain who didn't play is a no-show first.
    expect(poolFor(as({ tripleCaptain: true, minutes: 0 }))).toBe("noShow");
  });

  it("marks a new leader, a fall from the top and a last place bought with hits", () => {
    expect(poolFor(sampleAward("climber", "newLeader"))).toBe("newLeader");
    expect(poolFor(sampleAward("faller", "fromTop"))).toBe("fromTop");
    expect(poolFor(sampleAward("spoon", "paid"))).toBe("paid");
    expect(poolFor(sampleAward("spoon", "one"))).toBe("one");
  });

  it("says it's too early rather than nobody, while the award can't exist yet", () => {
    expect(skippedPool("climber", 1)).toBe("early");
    expect(skippedPool("faller", 1)).toBe("early");
    expect(skippedPool("climber", 2)).toBe("nobody");
    expect(skippedPool("middle", 2)).toBe("early");
    expect(skippedPool("middle", 3)).toBe("nobody");
    expect(skippedPool("hits", 1)).toBe("nobody");
  });
});

describe("the seeded pick", () => {
  const award = sampleAward("bench", "one");

  it("gives a card the same line every time", () => {
    const ctx = { leagueId: 314, gw: 5, lang: "pcm" as const };
    expect(roastFor(award, ctx)).toBe(roastFor(award, ctx));
  });

  it("varies between leagues", () => {
    const lines = new Set(Array.from({ length: 30 }, (_, i) => roastFor(award, { leagueId: i + 1, gw: 5, lang: "en" })));
    expect(lines.size).toBeGreaterThan(3);
  });

  it("skips a line with an unknown placeholder instead of breaking the card", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const lines = ["{nmae} typo", "{name} fine"];
    expect(Array.from({ length: 5 }, (_, i) => pickLine(lines, String(i), { name: "Ade" }))).toEqual(Array(5).fill("Ade fine"));
    expect(pickLine(["{nope}"], "x", {})).toBeNull();
    warn.mockRestore();
  });

  it("never fills from the object prototype", () => {
    expect(fill("{constructor}", {})).toBeNull();
  });
});

describe("numbers and names in each language", () => {
  it("puts units on numbers", () => {
    expect(unit(1, "point", "en")).toBe("1 point");
    expect(unit(0, "point", "en")).toBe("0 points");
    expect(unit(0, "point", "fr")).toBe("0 point");
    expect(unit(3, "place", "pcm")).toBe("3 places");
  });

  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map((n) => ordinal(n, "en"))).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st",
    ]);
    expect([1, 2, 10].map((n) => ordinal(n, "fr"))).toEqual(["1er", "2e", "10e"]);
  });

  it("lists names", () => {
    expect(nameList(["Kim", "Dave", "Tunde"], "pcm")).toBe("Kim, Dave and Tunde");
    expect(nameList(["Kim", "Dave"], "fr")).toBe("Kim et Dave");
  });
});

describe("roastView", () => {
  // GW1's real finding: most of a league captained the same flop.
  const flop = player(20, "Fernandes", 2);
  const managers = ["ade", "bola", "chidi", "dayo", "emeka"].map((name, i) => ({
    entry: i + 1,
    name,
    weeks: [{ points: 50 + i }],
    captain: flop,
    vice: player(30 + i, `Vice${i}`, 5),
  }));
  const view = buildLeagueView(makeBundle({ gw: 1, managers }));

  it("gives every award a roast and every skipped award a group line", () => {
    const { roasts, groupLines } = roastView(view, "pcm");
    expect(Object.keys(roasts).sort()).toEqual(view.awards.map((a) => a.id).sort());
    expect(Object.keys(groupLines).sort()).toEqual([...view.skipped].sort());
    expect(Object.values({ ...roasts, ...groupLines }).every((line) => line && !line.includes("{"))).toBe(true);
  });

  it("roasts a mass tie as one group", () => {
    const line = roastView(view, "en").roasts.captain!;
    expect(line).toContain("Fernandes");
    expect(line).toMatch(/5/);
  });

  it("explains early-season gaps in the Wrap", () => {
    const ctx = { leagueId: 1, gw: 1, lang: "en" as const };
    expect(groupLineFor("climber", ctx)).toMatch(/first gameweek/i);
    expect(groupLineFor("middle", ctx)).toMatch(/GW3/);
  });

  it("keeps the facts and only changes the words between languages", () => {
    const [pcmLine, frLine] = [roastView(view, "pcm"), roastView(view, "fr")].map((r) => r.roasts.captain!);
    expect(pcmLine).not.toBe(frLine);
    for (const line of [pcmLine, frLine]) expect(line).toContain("Fernandes");
  });
});

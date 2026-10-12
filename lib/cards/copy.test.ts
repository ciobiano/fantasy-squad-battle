import { describe as group, expect, it } from "vitest";
import { decimal, describe, ordinal, signed } from "./copy";

group("ordinal", () => {
  it("uses st, nd, rd and th, with teens as th", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 112].map((n) => ordinal(n, "en"))).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "112th",
    ]);
  });
  it("uses 1er then e in French", () => {
    expect([1, 2, 9].map((n) => ordinal(n, "fr"))).toEqual(["1er", "2e", "9e"]);
  });
});

group("numbers", () => {
  it("writes negatives with a minus sign", () => {
    expect(signed(-12)).toBe("−12");
    expect(signed(0)).toBe("0");
  });
  it("writes decimals the French way in French", () => {
    expect(decimal(52.2, "en")).toBe("52.2");
    expect(decimal(52.2, "fr")).toBe("52,2");
  });
});

group("describe", () => {
  it("shows the net score with the breakdown when there were hits", () => {
    const d = describe({ award: "oga", net: 92, hits: 4, gapByGw: [3, 49] }, 1, "pcm");
    expect(d).toEqual({ value: "92", note: "(96 −4)", message: "49 pass league average" });
  });

  it("leaves the breakdown out when nobody took a hit", () => {
    expect(describe({ award: "oga", net: 88, hits: 0, gapByGw: [40] }, 1, "en").note).toBe("");
  });

  it("says below the average for a negative gap", () => {
    expect(describe({ award: "spoon", net: 27, hits: 4, gapByGw: [-57] }, 1, "en").message).toBe("57 below the league average");
  });

  it("shows the move and the positions for one climber, 'each' for a tie", () => {
    const facts = { award: "climber", places: 3, from: 12, to: 9, rankByGw: [[12, 9]], leagueSize: 12 } as const;
    expect(describe(facts, 1, "en")).toMatchObject({ value: "3", arrow: "up", note: "12th → 9th" });
    expect(describe({ ...facts, award: "faller" }, 2, "en")).toMatchObject({ value: "3", arrow: "down", note: "places each" });
  });

  it("shows hits as a negative number", () => {
    expect(describe({ award: "hits", gross: 47, paid: 12 }, 1, "en").value).toBe("−12");
  });

  it("keeps the same facts in every language (D2)", () => {
    const facts = { award: "captain", captain: { name: "João Pedro", points: 0 }, best: { name: "Groß", points: 28 } } as const;
    const values = (["pcm", "en", "fr"] as const).map((lang) => describe(facts, 1, lang).value);
    expect(new Set(values)).toEqual(new Set(["0"]));
  });
});

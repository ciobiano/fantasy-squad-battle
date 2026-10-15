import { describe, expect, it } from "vitest";
import { airAbove, barPercent, rankChart, sky, trendChart } from "./geometry";

describe("sky", () => {
  it("starts deep teal and fades into the card's ground", () => {
    const light = sky("light", "status");
    expect(light.height).toBe(1250);
    expect(light.background).toMatch(/^linear-gradient\(180deg, #143A53 0px, #1F4459 200px, /);
    expect(light.background).toMatch(/#FFFFFF 1250px\)$/);
  });

  it("adds the mint glow only in dark", () => {
    expect(sky("dark", "x").background.startsWith("radial-gradient(")).toBe(true);
    expect(sky("light", "x").background.startsWith("linear-gradient(")).toBe(true);
    expect(sky("dark", "x").background).toMatch(/#08090A 720px\)$/);
  });
});

describe("airAbove", () => {
  it("keeps the full sky for one winner and shrinks it for groups", () => {
    expect(airAbove("status", 1)).toBe(230);
    expect(airAbove("status", 2)).toBeLessThan(230);
    expect(airAbove("status", 3)).toBe(114);
    expect(airAbove("x", 3)).toBe(64);
  });

  it("treats more than three winners like three (the rest are counted)", () => {
    expect(airAbove("status", 7)).toBe(airAbove("status", 3));
  });

  it("drops the block lower on a card with no visual", () => {
    expect(airAbove("status", 2, false)).toBeGreaterThan(airAbove("status", 2));
    expect(airAbove("x", 1, false)).toBeGreaterThan(airAbove("x", 1));
  });
});

describe("trendChart", () => {
  it("puts the highest gap near the top and the zero line below it", () => {
    const t = trendChart([3, 10, 7, 9, 49], 860, 190);
    expect(t.end.x).toBeCloseTo(840);
    expect(t.end.y).toBeCloseTo(190 * 0.16);
    expect(t.zeroY).toBeCloseTo(190 * 0.84);
  });

  it("draws a line even with one gameweek of history", () => {
    const t = trendChart([12], 860, 190);
    expect(t.points.split(" ")).toHaveLength(2);
  });
});

describe("rankChart", () => {
  it("puts 1st at the top and last at the bottom", () => {
    const r = rankChart([[1, 12]], 12, 860, 190, 28);
    const [first, last] = r.lines[0].points.split(" ").map((p) => Number(p.split(",")[1]));
    expect(first).toBeCloseTo(r.topY);
    expect(last).toBeCloseTo(r.bottomY);
  });

  it("spreads close movers over the frame instead of the whole league", () => {
    const r = rankChart([[6, 5], [7, 6], [8, 7]], 12, 876, 110, 22);
    const ends = r.lines.map((line) => line.end.y);
    expect(ends[1] - ends[0]).toBeGreaterThan(14);
  });

  it("keeps end labels a line apart when the dots are close", () => {
    const r = rankChart([[6, 5], [7, 6], [8, 7]], 12, 876, 110, 22);
    const ys = r.lines.map((line) => line.labelY).sort((a, b) => a - b);
    expect(ys[1] - ys[0]).toBeGreaterThan(25.9);
    expect(ys[2] - ys[1]).toBeGreaterThan(25.9);
    expect(ys[2]).toBeLessThanOrEqual(110 - 12);
  });
});

describe("barPercent", () => {
  it("never draws a bar thinner than 2%", () => {
    expect(barPercent(0, 28)).toBe(2);
    expect(barPercent(28, 28)).toBe(100);
    expect(barPercent(5, 0)).toBe(2);
  });
});

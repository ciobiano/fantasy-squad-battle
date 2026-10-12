import { describe, expect, it } from "vitest";
import { badgeFor, initials } from "./badge";
import { age, compactRank, firstName, movement } from "./format";

describe("format", () => {
  it("shortens big ranks", () => {
    expect(compactRank(8)).toBe("8");
    expect(compactRank(18_402)).toBe("18,402");
    expect(compactRank(412_388)).toBe("412K");
    expect(compactRank(1_204_555)).toBe("1.2M");
    expect(compactRank(2_000_000)).toBe("2M");
  });
  it("reads movement from last rank to rank", () => {
    expect(movement(8, 10)).toEqual({ direction: "up", places: 2 });
    expect(movement(14, 11)).toEqual({ direction: "down", places: 3 });
    expect(movement(3, 3)).toEqual({ direction: "none", places: 0 });
    expect(movement(5, null)).toEqual({ direction: "none", places: 0 });
  });
  it("writes ages in hours, then days", () => {
    const now = Date.parse("2026-10-12T12:00:00Z");
    expect(age("2026-10-12T09:30:00Z", now)).toBe("2h");
    expect(age("2026-10-12T11:59:00Z", now)).toBe("1h");
    expect(age("2026-10-09T12:00:00Z", now)).toBe("3d");
  });
  it("keeps the first name only", () => {
    expect(firstName("  Ralph   Obiano ")).toBe("Ralph");
  });
});

describe("badges", () => {
  it("takes initials from the first two words", () => {
    expect(initials("No Gree For Anybody")).toBe("NG");
    expect(initials("Jollof United")).toBe("JU");
    expect(initials("Odogwu")).toBe("O");
    expect(initials("ìjẹ̀bú boys")).toBe("ÌB");
  });
  it("gives the same team the same badge every time", () => {
    expect(badgeFor("Danfo Rovers")).toEqual(badgeFor("danfo rovers "));
    const b = badgeFor("Danfo Rovers");
    expect(b.colour).toBeGreaterThanOrEqual(1);
    expect(b.colour).toBeLessThanOrEqual(8);
  });
});

import { describe, expect, it } from "vitest";
import { cacheControl, cardKind, cardOptions, gameweek } from "./request";

describe("cardOptions", () => {
  it("defaults to a dark Status card in Pidgin", () => {
    expect(cardOptions(new URLSearchParams())).toEqual({ format: "status", theme: "dark", lang: "pcm" });
  });

  it("reads known values and ignores anything else", () => {
    expect(cardOptions(new URLSearchParams("format=x&theme=light&lang=fr"))).toEqual({ format: "x", theme: "light", lang: "fr" });
    expect(cardOptions(new URLSearchParams("format=gif&theme=pink&lang=de"))).toEqual({ format: "status", theme: "dark", lang: "pcm" });
  });
});

describe("cardKind", () => {
  it("accepts the Wrap and the eight awards only", () => {
    expect(cardKind("wrap")).toEqual({ kind: "wrap" });
    expect(cardKind("spoon")).toEqual({ kind: "award", award: "spoon" });
    expect(cardKind("toString")).toBeNull();
    expect(cardKind("../etc")).toBeNull();
  });
});

describe("gameweek", () => {
  it("accepts 1 to 38", () => {
    expect(gameweek("1")).toBe(1);
    expect(gameweek("38")).toBe(38);
    expect(gameweek("0")).toBeNull();
    expect(gameweek("39")).toBeNull();
    expect(gameweek("5a")).toBeNull();
    expect(gameweek("005")).toBeNull();
  });
});

describe("cacheControl", () => {
  it("caches final gameweeks for longer than provisional ones", () => {
    expect(cacheControl(false)).toContain("s-maxage=86400");
    expect(cacheControl(true)).toContain("s-maxage=300");
  });
});

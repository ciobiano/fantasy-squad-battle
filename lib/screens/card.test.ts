import { describe, expect, it } from "vitest";
import { cardRequest } from "@/lib/cards/request";
import { loadCard } from "./card";

const load = (league: string, gw: string, award: string, query = "") => {
  const request = cardRequest({ league, gw, award }, new URLSearchParams(query));
  if (!request) throw new Error("bad request");
  return loadCard(request);
};

describe("loadCard", () => {
  it("draws the sample league's cards, in the asked language", async () => {
    const wrap = await load("sample", "5", "wrap");
    expect(wrap.kind === "ready" && wrap.view.kind).toBe("wrap");
    const spoon = await load("sample", "5", "spoon", "lang=en&provisional=1");
    if (spoon.kind !== "ready" || spoon.view.kind !== "award") throw new Error("not an award card");
    expect(spoon.view.model.meta.provisional).toBe(true);
    expect(spoon.view.model.roast).toContain("Chidi");
  });
  it("has no cards for other leagues or gameweeks yet", async () => {
    expect(await load("314", "5", "wrap")).toEqual({ kind: "not-found" });
    expect(await load("sample", "6", "wrap")).toEqual({ kind: "not-found" });
  });
});

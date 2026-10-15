import { describe, expect, it } from "vitest";
import { cardRequest } from "@/lib/cards/request";
import { loadCard } from "./card";
import type { LeagueSource } from "./league";
import { liveSource } from "./testing";

const load = (league: string, gw: string, award: string, query = "", source: LeagueSource = liveSource()) => {
  const request = cardRequest({ league, gw, award }, new URLSearchParams(query));
  if (!request) throw new Error("bad request");
  return loadCard(request, source);
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
  it("draws a real league's cards from its view, asking for the card's gameweek", async () => {
    const asked: (number | undefined)[] = [];
    const source = liveSource();
    const spy: LeagueSource = { ...source, view: (id, options) => { asked.push(options.gw); return source.view(id, options); } };
    const spoon = await load("314", "5", "spoon", "lang=pcm", spy);
    if (spoon.kind !== "ready" || spoon.view.kind !== "award") throw new Error("not an award card");
    expect(spoon.view.model.meta).toEqual({ leagueName: "Denizens of Olympus", gw: 5, provisional: false });
    expect(spoon.view.model.roast.length).toBeGreaterThan(0);
    expect(asked).toEqual([5]);
  });
  it("has no card for a league or gameweek without one", async () => {
    const missing: LeagueSource = { ...liveSource(), view: async () => ({ ok: false, reason: "league-not-found" }) };
    expect(await load("314", "5", "wrap", "", missing)).toEqual({ kind: "not-found" });
    expect(await load("sample", "6", "wrap")).toEqual({ kind: "not-found" });
  });
});

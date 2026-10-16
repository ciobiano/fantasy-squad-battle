import { describe, expect, it } from "vitest";
import { AWARD_KEYS } from "@/lib/awards";
import type { LeagueView } from "@/lib/league/types";
import { cardFromView, marketFromView, tableFromView } from "./from-view";
import { testView } from "./testing";

const award = (view: LeagueView, key: string) => {
  const card = cardFromView(view, key as "oga", "en");
  if (card?.kind !== "award") throw new Error(`no ${key} card`);
  return card.model;
};

describe("marketFromView", () => {
  it("keeps the view's order and marks the visitor", () => {
    const market = marketFromView(testView(22));
    expect(market.rows.map((r) => r.manager.firstName)).toEqual(["Emeka", "Tobi", "Kemi", "Ngozi", "Bayo", "Chidi"]);
    expect(market.rows.filter((r) => r.you).map((r) => r.manager.id)).toEqual([22]);
    expect(market).toMatchObject({ leagueId: "314", leagueName: "Denizens of Olympus", gw: 5 });
  });
  it("starts a late joiner's line where they joined", () => {
    expect(marketFromView(testView()).rows.find((r) => r.manager.firstName === "Ngozi")?.gapSeries).toHaveLength(3);
  });
  it("lines Team of the Week up from the goalkeeper and marks the top player", () => {
    const lines = marketFromView(testView()).teamOfTheWeek.lines;
    expect(lines[0].map((p) => p.name)).toEqual(["Rushworth"]);
    expect(lines.flat().every((p) => p.club === "TST")).toBe(true);
    expect(lines.flat().filter((p) => p.top).map((p) => p.name)).toEqual(["Brobbey"]);
  });
});

describe("tableFromView", () => {
  it("lists the standings after the gameweek, first names only", () => {
    const table = tableFromView(testView(22));
    expect(table.rows.map((r) => [r.pos, r.firstName])).toEqual([[1, "Tobi"], [2, "Emeka"], [3, "Kemi"], [4, "Bayo"], [5, "Chidi"], [6, "Ngozi"]]);
    expect(table.rows.find((r) => r.you)?.entry).toBe(22);
    expect(JSON.stringify(table)).not.toContain("Okafor");
  });
});

describe("cardFromView", () => {
  const view = testView();

  it("charts a climber's league rank over the season, ending where the award says", () => {
    const climber = award(view, "climber");
    const winner = view.awards.find((a) => a.id === "climber")?.winners[0];
    if (climber.facts.award !== "climber") throw new Error("not a climber");
    expect(climber.facts.rankByGw[0].at(-1)).toBe(winner?.ranks?.to);
    expect(climber.facts.rankByGw[0]).toHaveLength(5);
    expect(climber.facts.leagueSize).toBe(6);
  });
  it("shows Middle Class over its 3-gameweek window", () => {
    const middle = award(view, "middle");
    if (middle.facts.award !== "middle") throw new Error("not middle");
    expect(middle.facts.rankByGw.every((series) => series.length === 4)).toBe(true);
    expect(middle.facts.places).toBe(1);
  });
  it("sets a captain disaster against the best other player in that team", () => {
    const captain = award(view, "captain");
    expect(captain.facts).toEqual({ award: "captain", captain: { name: "Fernandes", points: 2 }, best: { name: "Saka", points: 5, scope: "team" } });
  });
  it("falls back to the gameweek's top player when nobody else in the team counted", () => {
    const lone = {
      ...view,
      awards: view.awards.map((a) =>
        a.id === "captain" ? { ...a, winners: a.winners.map((w) => ({ ...w, captain: w.captain ? { ...w.captain, best: null } : undefined })) } : a,
      ),
    };
    expect(award(lone, "captain").facts).toMatchObject({ best: { name: "Brobbey", points: 17, scope: "gameweek" } });
  });
  it("puts Bench Regret's benched players on the card", () => {
    const benched = [{ name: "Wissa", points: 13 }, { name: "Mbeumo", points: 8 }];
    const withBench = { ...view, awards: view.awards.map((a) => (a.id === "bench" ? { ...a, winners: a.winners.map((w) => ({ ...w, bench: benched })) } : a)) };
    expect(award(withBench, "bench").facts).toEqual({ award: "bench", total: 21, players: benched });
  });
  describe("an award several managers share", () => {
    // Two winners of everything, the second with different details.
    const tied = {
      ...view,
      awards: view.awards.map((a) => {
        const [w] = a.winners;
        const other = {
          ...w,
          manager: { ...w.manager, id: 999, firstName: "Femi" },
          score: w.score ? { ...w.score, points: w.score.points + 4, hits: w.score.hits + 4 } : undefined,
          captain: w.captain ? { ...w.captain, name: "Haaland" } : undefined,
          bench: [{ name: "Raya", points: 9 }],
        };
        return { ...a, winners: [{ ...w, bench: [{ name: "Wissa", points: 13 }] }, other] };
      }),
    };
    it("keeps the shared number and drops one manager's details", () => {
      expect(award(tied, "bench").facts).toEqual({ award: "bench", total: 21, players: [] });
      expect(award(tied, "hits").facts).toMatchObject({ gross: null });
      expect(award(tied, "oga").facts).toMatchObject({ hits: 0, gapByGw: [] });
    });
    it("sets the captain against the gameweek's top player, unnamed when the captains differ", () => {
      expect(award(tied, "captain").facts).toEqual({
        award: "captain",
        captain: { name: null, points: 2 },
        best: { name: "Brobbey", points: 17, scope: "gameweek" },
      });
    });
  });
  it("gives every award card its roast line, the same every time", () => {
    for (const key of AWARD_KEYS) {
      const roast = award(view, key).roast;
      expect(roast.length).toBeGreaterThan(0);
      expect(award(testView(), key).roast).toBe(roast);
    }
  });
  it("puts every award on the Wrap in story order, with the card's numbers", () => {
    const wrap = cardFromView(view, "wrap", "en");
    if (wrap?.kind !== "wrap") throw new Error("no wrap");
    expect(wrap.model.rows.map((r) => r.award)).toEqual([...AWARD_KEYS]);
    expect(wrap.model.rows.find((r) => r.award === "hits")?.value).toBe("−8");
    expect(wrap.model.rows.find((r) => r.award === "climber")).toMatchObject({ movement: "up", value: "2" });
    expect(wrap.model.leagueAverage).toBe(55.3);
  });
  it("names three winners on the Wrap, then counts the rest", () => {
    const crowd = view.awards.find((a) => a.id === "captain");
    if (!crowd) throw new Error("no captain award");
    const winners = Array.from({ length: 5 }, (_, i) => ({ ...crowd.winners[0], manager: { ...crowd.winners[0].manager, firstName: `M${i}` } }));
    const wrap = cardFromView({ ...view, awards: view.awards.map((a) => (a.id === "captain" ? { ...a, winners } : a)) }, "wrap", "en");
    expect(wrap?.kind === "wrap" && wrap.model.rows.find((r) => r.award === "captain")?.winners).toEqual(["M0", "M1", "M2", "+2 others"]);
  });
  it("gives an award nobody won a group line on the Wrap, and no card", () => {
    const noHits: LeagueView = { ...view, awards: view.awards.filter((a) => a.id !== "hits"), skipped: ["hits"] };
    const wrap = cardFromView(noHits, "wrap", "pcm");
    const row = wrap?.kind === "wrap" ? wrap.model.rows.find((r) => r.award === "hits") : null;
    expect(row).toMatchObject({ winners: [], value: null });
    expect(row?.groupLine?.length).toBeGreaterThan(0);
    expect(cardFromView(noHits, "hits", "pcm")).toBeNull();
  });
});

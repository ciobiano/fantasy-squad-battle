import { afterEach, describe, expect, it, vi } from "vitest";
import type { Standings } from "@/lib/fpl/schemas";
import { loadLeague, type LeagueSource, type LeagueView } from "./league";
import { liveSource, missingSource } from "./testing";

const standings: Standings = {
  league: { id: 314, name: " Denizens of Olympus " },
  standings: {
    has_next: true,
    page: 1,
    results: [
      { entry: 11, entry_name: "Chop Life FC", player_name: "Tobi Adeyemi", rank: 1, last_rank: 2, total: 357, event_total: 64 },
      { entry: 22, entry_name: "Agbero Athletic", player_name: "Emeka Okafor", rank: 2, last_rank: 0, total: 356, event_total: 96 },
    ],
  },
};

const live: LeagueSource = { standings: async () => standings, latestGameweek: async () => 7, view: async () => ({ ok: false, reason: "preseason" }) };

async function view(...args: Parameters<typeof loadLeague>): Promise<LeagueView> {
  const screen = await loadLeague(...args);
  if (screen.kind !== "ready") throw new Error(screen.kind);
  return screen.view;
}


afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadLeague, Table", () => {
  it("shows first names only, never surnames", async () => {
    const v = await view("314", "table", null, live);
    if (v.body.kind !== "table") throw new Error(v.body.kind);
    expect(v.body.table.rows.map((r) => r.firstName)).toEqual(["Tobi", "Emeka"]);
    expect(JSON.stringify(v)).not.toContain("Adeyemi");
  });
  it("marks the remembered team, flags leagues over 50 and trims the name", async () => {
    const v = await view("314", "table", 22, live);
    if (v.body.kind !== "table") throw new Error(v.body.kind);
    expect(v.body.table.rows.map((r) => r.you)).toEqual([false, true]);
    expect(v.body.table.truncated).toBe(true);
    expect(v).toMatchObject({ leagueName: "Denizens of Olympus", gw: 7, changeHref: "/team/22" });
  });
  it("treats FPL's last_rank 0 as no previous rank", async () => {
    const v = await view("314", "table", null, live);
    if (v.body.kind !== "table") throw new Error(v.body.kind);
    expect(v.body.table.rows[1].move.direction).toBe("none");
    expect(v.changeHref).toBe("/?start=1&mode=league");
  });
});

describe("loadLeague, Market", () => {
  it("shows a real league's Market from its league view, marking the visitor", async () => {
    const v = await view("314", "market", 22, liveSource());
    if (v.body.kind !== "market") throw new Error(v.body.kind);
    expect(v).toMatchObject({ leagueName: "Denizens of Olympus", gw: 5 });
    expect(v.body.market.rows.map((r) => [r.firstName, r.net, r.you])[0]).toEqual(["Emeka", 92, true]);
    expect(v.body.market.stories.map((s) => s.key)).toHaveLength(9);
  });
  it("shows a note before the season's first gameweek, named from the standings", async () => {
    const v = await view("314", "market", null, live);
    expect(v.body).toEqual({ kind: "market-soon" });
    expect(v.leagueName).toBe("Denizens of Olympus");
  });
  it("shows the sample league's Market, ranked by net score, one emoji per row", async () => {
    const v = await view("sample", "market", null, live);
    if (v.body.kind !== "market") throw new Error(v.body.kind);
    const rows = v.body.market.rows;
    expect(rows.map((r) => r.net)).toEqual(rows.map((r) => r.net).toSorted((a, b) => (b ?? 0) - (a ?? 0)));
    expect(rows.find((r) => r.firstName === "Bayo")?.award).toBe("captain");
    expect(rows.find((r) => r.firstName === "Tobi")?.award).toBeNull();
    expect(rows.find((r) => r.firstName === "Bayo")?.href).toBe("/league/sample/story/captain");
    expect(v.body.market.stories.map((s) => s.key)).toEqual(["wrap", "oga", "climber", "captain", "bench", "hits", "middle", "faller", "spoon"]);
  });
  it("draws a positive gap above the zero line and turns rank change into a move", async () => {
    const v = await view("sample", "market", null, live);
    if (v.body.kind !== "market") throw new Error(v.body.kind);
    const kemi = v.body.market.rows[0];
    expect(kemi.spark.direction).toBe("up");
    expect(Number(kemi.spark.points.split(" ").at(-1)?.split(",")[1])).toBeLessThan(kemi.spark.baseY);
    expect(kemi.move).toEqual({ direction: "up", places: 2 });
  });
});

describe("loadLeague, outcomes", () => {
  it("is a 404 for anything that isn't a league ID or the sample", async () => {
    expect(await loadLeague("abc", "market", null, live)).toEqual({ kind: "not-found" });
  });
  it("sends an unknown league back to Start with the reason, from either tab", async () => {
    const to = "/?start=1&mode=league&q=314&error=league-not-found";
    expect(await loadLeague("314", "table", null, missingSource())).toEqual({ kind: "redirect", to });
    expect(await loadLeague("314", "market", null, missingSource())).toEqual({ kind: "redirect", to });
  });
  it("shows the down panel, retrying the same tab", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: LeagueSource = { ...live, standings: async () => Promise.reject(new Error("403")), view: async () => Promise.reject(new Error("403")) };
    expect(await loadLeague("314", "table", null, down)).toEqual({ kind: "down", retry: "/league/314/table" });
    expect(await loadLeague("314", "market", null, down)).toEqual({ kind: "down", retry: "/league/314" });
  });
});

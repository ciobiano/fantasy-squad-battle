import { describe, expect, it, vi } from "vitest";
import type { PlannerData } from "@/lib/planner";
import type { MyLeague } from "@/lib/league/my-team";
import type { PaperTable } from "@/lib/planner/league";
import {
  compareHref, compareLeague, loadDraft, loadPaperRank, loadPlan, loadTeamRating, plannerDestination, plannerStartView,
  type PlannerScreenSource, type RatedTeamView,
} from "./planner";

const RULES: PlannerData["rules"] = {
  squadSize: 15, starters: 11, clubLimit: 3, budget: 1000, sellOnFee: 0.5, maxFreeTransfers: 5, transfersCap: 20, hitCost: 4,
  positions: { GK: { squad: 2, min: 1, max: 1 }, DEF: { squad: 5, min: 3, max: 5 }, MID: { squad: 5, min: 2, max: 5 }, FWD: { squad: 3, min: 1, max: 3 } },
  chips: [],
};

const player = (id: number, name: string) => ({
  id, name, club: 1, position: "MID" as const, price: 60, points: [4, 4], status: "a", chance: null, news: "", ownership: 1, form: 4, penalties: false, priceTrend: null,
});

const data: PlannerData = {
  gws: [8, 9],
  deadline: "2026-10-23T17:30:00Z",
  rules: RULES,
  players: [player(399, "Cherki"), player(427, "Mbeumo"), player(290, "Slater"), player(68, "Tavernier")],
  clubs: [],
  outlook: [],
  team: {
    id: 3920688,
    name: "PASUZAE ",
    asOf: 7,
    start: { gw: 8, squad: [], bank: 17, freeTransfers: 1, chipsUsed: [] },
    guessedPrices: [],
    rating: { points: 107.46, perWeek: [53.67, 53.79], byPosition: { GK: 6, DEF: 33, MID: 26, FWD: 30 }, captaincy: 12.46, players: [] },
    ideas: {
      singles: [{ transfers: [{ out: 399, in: 427 }], gain: 9.67, bank: 17 }],
      pairs: [{ transfers: [{ out: 399, in: 427 }, { out: 290, in: 68 }], gain: 12.83, bank: 0 }],
    },
  },
};

const league = (id: number, name: string, members: number | null, rank: number | null, kind: MyLeague["kind"] = "private"): MyLeague => ({
  id, name, kind, members, rank, lastRank: null,
});

const LEAGUES: readonly MyLeague[] = [
  league(1261677, "Arena of Champions", 11, 2),
  league(999, "Not started", null, null),
  league(314, "Overall", 11_000_000, 812_345, "public"),
  league(77, "Screamerz", 26, 4),
];

const source = (over: Partial<PlannerScreenSource> = {}): PlannerScreenSource => ({
  planner: async () => ({ kind: "ready", data }),
  paper: async () => ({ kind: "no-squads" }),
  myTeam: async () => ({ ok: true, data: { id: 3920688, firstName: "Amateze", teamName: "PASUZAE", leagues: LEAGUES } }),
  ...over,
});

const rated = async (src = source()): Promise<RatedTeamView> => {
  const screen = await loadTeamRating("3920688", src);
  if (screen.kind !== "ready" || screen.view.kind !== "rated") throw new Error(screen.kind);
  return screen.view;
};

describe("Planner Start", () => {
  it("keeps what was typed and a known reason, and drops an unknown one", () => {
    expect(plannerStartView({ q: "99999999", error: "team-not-found" })).toEqual({ value: "99999999", error: "team-not-found" });
    expect(plannerStartView({ q: "1", error: "nonsense" })).toEqual({ value: "1", error: null });
  });
  it("sends a team ID or Points link to the rating, and anything else back with the reason", () => {
    expect(plannerDestination({ q: "3920688" })).toBe("/planner/3920688");
    expect(plannerDestination({ q: "https://fantasy.premierleague.com/entry/3920688/event/7" })).toBe("/planner/3920688");
    expect(plannerDestination({ q: "" })).toBe("/planner?start=1&q=&error=empty");
    expect(plannerDestination({ q: "https://fantasy.premierleague.com/leagues/314/standings/c" })).toContain("error=not-a-team");
  });
});

describe("loadTeamRating", () => {
  it("rates the squad over the window, its parts adding up to the rating", async () => {
    const view = await rated();
    expect(view).toMatchObject({ team: { id: 3920688, name: "PASUZAE" }, asOf: 7, firstGw: 8, lastGw: 9, points: 107.46 });
    expect(view.weeks).toEqual([{ gw: 8, points: 53.67 }, { gw: 9, points: 53.79 }]);
    expect(view.parts.reduce((sum, p) => sum + p.points, 0)).toBeCloseTo(view.points);
    expect(view.parts.find((p) => p.key === "DEF")?.share).toBe(1);
  });
  it("names the transfer ideas and counts the hit beyond the free transfers", async () => {
    const view = await rated();
    expect(view.singles).toEqual([{ moves: [{ out: "Cherki", in: "Mbeumo" }], gain: 9.67, hit: 0, bank: 17 }]);
    expect(view.pairs[0]).toMatchObject({ moves: [{ out: "Cherki", in: "Mbeumo" }, { out: "Slater", in: "Tavernier" }], hit: 4 });
  });
  it("names the manager and lists only the leagues that can rank the squad", async () => {
    const view = await rated();
    expect(view.team.manager).toBe("Amateze");
    expect(view.leagues).toEqual([{ id: 1261677, name: "Arena of Champions", members: 11 }, { id: 77, name: "Screamerz", members: 26 }]);
  });
  it("still rates the squad when the team's leagues don't load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const view = await rated(source({ myTeam: async () => { throw new Error("503"); } }));
    expect(view).toMatchObject({ points: 107.46, leagues: [], team: { manager: "" } });
  });
  it("sends an unknown team back to Start with the reason", async () => {
    const screen = await loadTeamRating("99999999", source({ planner: async () => ({ kind: "team-not-found" }) }));
    expect(screen).toEqual({ kind: "redirect", to: "/planner?start=1&q=99999999&error=team-not-found" });
  });
  it("says when a new team has no squad yet", async () => {
    const screen = await loadTeamRating("5", source({
      planner: async () => ({ kind: "no-squad", team: { id: 5, name: "Agbero Athletic " }, deadline: "2026-10-23T17:30:00Z" }),
    }));
    expect(screen).toMatchObject({ kind: "ready", view: { kind: "no-squad", team: { id: 5, name: "Agbero Athletic" }, deadline: "2026-10-23T17:30:00Z" } });
  });
  it("shows the FPL panel when FPL is down, with a retry back here", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const screen = await loadTeamRating("5", source({ planner: async () => { throw new Error("503"); } }));
    expect(screen).toEqual({ kind: "down", retry: "/planner/5" });
  });
  it("is a 404 for a segment that isn't a team ID", async () => {
    expect(await loadTeamRating("abc", source())).toEqual({ kind: "not-found" });
  });
});

describe("compareLeague", () => {
  const leagues = [{ id: 1, name: "Futo", members: 5 }, { id: 2, name: "Arena", members: 11 }, { id: 3, name: "Screamerz", members: 26 }];
  it("takes the picked league, then the remembered one, then the first", () => {
    expect(compareLeague(leagues, "3", 2)?.id).toBe(3);
    expect(compareLeague(leagues, undefined, 2)?.id).toBe(2);
    expect(compareLeague(leagues, undefined, null)?.id).toBe(1);
  });
  it("skips a league that can't rank this squad, and has nothing without leagues", () => {
    expect(compareLeague(leagues, "999", 314)?.id).toBe(1);
    expect(compareLeague(leagues, ["x"], null)?.id).toBe(1);
    expect(compareLeague([], "1", 1)).toBeNull();
  });
  it("links each league to Your team, staying on it", () => {
    expect(compareHref(3920688, 77)).toBe("/planner/3920688?league=77");
  });
});

describe("loadPaperRank", () => {
  const table: PaperTable = {
    kind: "ready",
    league: { id: 1261677, name: "Arena of Champions " },
    asOf: 7,
    gws: [8, 9],
    truncated: false,
    rows: [
      { entry: 8146194, entryName: "B2B Trini", firstName: "JB", rank: 1, leagueRank: 3, rating: data.team!.rating },
      { entry: 3920688, entryName: "PASUZAE", firstName: "Amateze", rank: 2, leagueRank: 4, rating: data.team!.rating },
    ],
  };
  it("finds the team's rank on paper in the league it's compared in", async () => {
    expect(await loadPaperRank(1261677, 3920688, source({ paper: async () => table }))).toEqual({
      rank: 2, of: 2, leagueName: "Arena of Champions", href: "/league/1261677/paper",
    });
  });
  it("shows nothing without a league, for a team that isn't in it, or when it fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await loadPaperRank(null, 3920688, source())).toBeNull();
    expect(await loadPaperRank(1261677, 1, source({ paper: async () => table }))).toBeNull();
    expect(await loadPaperRank(1261677, 3920688, source({ paper: async () => { throw new Error("503"); } }))).toBeNull();
  });
});

describe("loadPlan", () => {
  it("sends the board the squad without the rating, and opens a transfer idea", async () => {
    const screen = await loadPlan("3920688", { idea: "p0" }, source());
    if (screen.kind !== "ready") throw new Error(screen.kind);
    expect(screen.view.data.team).toEqual({ id: 3920688, name: "PASUZAE", asOf: 7, start: data.team!.start });
    expect(screen.view.idea).toEqual([{ out: 399, in: 427 }, { out: 290, in: 68 }]);
    expect((await loadPlan("3920688", { idea: "s9" }, source())).kind === "ready").toBe(true);
  });
  it("goes back to the rating when there's no squad, and to Start for an unknown team", async () => {
    expect(await loadPlan("5", {}, source({ planner: async () => ({ kind: "no-squad", team: { id: 5, name: "A" }, deadline: null }) }))).toEqual({
      kind: "redirect", to: "/planner/5",
    });
    expect(await loadPlan("5", {}, source({ planner: async () => ({ kind: "team-not-found" }) }))).toMatchObject({ kind: "redirect" });
  });
  it("loads a draft with no squad", async () => {
    const screen = await loadDraft(source({ planner: async () => ({ kind: "ready", data: { ...data, team: null } }) }));
    expect(screen).toMatchObject({ kind: "ready", view: { data: { team: null }, idea: null } });
  });
});


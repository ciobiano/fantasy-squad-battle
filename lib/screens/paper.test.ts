import { describe, expect, it, vi } from "vitest";
import type { PaperTable } from "@/lib/planner/league";
import { loadLeaguePaper, type PaperSource } from "./paper";

const rating = (points: number) => ({ points, perWeek: [], byPosition: { GK: 0, DEF: 0, MID: 0, FWD: 0 }, captaincy: 0, players: [] });

const table: PaperTable = {
  kind: "ready",
  league: { id: 1261677, name: " Arena of Champions" },
  asOf: 7,
  gws: [8, 9, 10, 11, 12, 13],
  truncated: false,
  rows: [
    { entry: 8146194, entryName: "B2B Trini", firstName: "JB", rank: 1, leagueRank: 3, rating: rating(339.31) },
    { entry: 3920688, entryName: "PASUZAE", firstName: "Amateze", rank: 2, leagueRank: 4, rating: rating(326.57) },
    { entry: 8302258, entryName: "SHERUBAWON FC", firstName: "Ayo", rank: 8, leagueRank: 1, rating: rating(307.09) },
  ],
};

const source = (over: Partial<PaperSource> = {}): PaperSource => ({
  paper: async () => table,
  standings: async () => ({ league: { id: 1261677, name: "Arena of Champions" }, standings: { has_next: false, page: 1, results: [] } }),
  ...over,
});

describe("loadLeaguePaper", () => {
  it("ranks the squads on paper beside the table, marking you", async () => {
    const screen = await loadLeaguePaper("1261677", 3920688, source());
    if (screen.kind !== "ready" || screen.view.body.kind !== "paper") throw new Error(screen.kind);
    const { view } = screen;
    expect(view).toMatchObject({ leagueId: "1261677", leagueName: "Arena of Champions", tab: "paper", gw: 7, changeHref: "/team/3920688" });
    const paper = screen.view.body.kind === "paper" ? screen.view.body.paper : null;
    expect(paper?.rows.map((r) => [r.rank, r.firstName, r.leagueRank, r.you])).toEqual([[1, "JB", 3, false], [2, "Amateze", 4, true], [8, "Ayo", 1, false]]);
    expect(paper).toMatchObject({ firstGw: 8, lastGw: 13, headline: { best: "JB", leader: "Ayo", leaderRank: 8 } });
  });
  it("says squads come later before the first deadline", async () => {
    const screen = await loadLeaguePaper("1261677", null, source({ paper: async () => ({ kind: "no-squads" }) }));
    expect(screen).toMatchObject({ kind: "ready", view: { leagueName: "Arena of Champions", gw: null, body: { kind: "paper-soon" } } });
  });
  it("sends an unknown league back to Start, and the sample league to its Market", async () => {
    expect(await loadLeaguePaper("9", null, source({ paper: async () => ({ kind: "league-not-found" }) }))).toEqual({
      kind: "redirect", to: "/?start=1&mode=league&q=9&error=league-not-found",
    });
    expect(await loadLeaguePaper("sample", null, source())).toEqual({ kind: "redirect", to: "/league/sample" });
  });
  it("shows the FPL panel when FPL is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await loadLeaguePaper("9", null, source({ paper: async () => { throw new Error("503"); } }))).toEqual({ kind: "down", retry: "/league/9/paper" });
  });
});

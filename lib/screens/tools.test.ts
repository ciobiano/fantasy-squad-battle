import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFixtures } from "./fixtures";
import { loadPlayers, type PlayersView } from "./players";
import type { InjuryRow, TickerRow, ToolsSource } from "./tools";

const tick = (short: string, run: number): TickerRow => ({ team: { id: run, name: short, short }, weeks: [{ gw: 8, matches: [] }], runScore: run });
const injury = (player: string, team: string, status: InjuryRow["status"]): InjuryRow => ({
  player, team, position: "MID", status, chance: null, news: "", reportedAt: "2026-10-12T09:00:00Z",
});

const ticker = [tick("EVE", 21), tick("TOT", 16), tick("COV", 16)];
const rows = [injury("Isak", "LIV", "injured"), injury("Schade", "BRE", "doubtful"), injury("Obi", "MUN", "unavailable"), injury("Gakpo", "LIV", "injured")];
const source: ToolsSource = {
  ticker: async () => ticker,
  injuries: async () => ({ rows, clubs: ["BRE", "LIV", "MUN"], asOf: 0 }),
};

async function players(query: Record<string, string>): Promise<PlayersView> {
  const screen = await loadPlayers(query, source);
  if (screen.kind !== "ready") throw new Error(screen.kind);
  return screen.view;
}


afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadFixtures", () => {
  it("puts the easiest run first, ties by name, without changing the source", async () => {
    const easy = await loadFixtures({}, source);
    const az = await loadFixtures({ sort: "az" }, source);
    if (easy.kind !== "ready" || az.kind !== "ready") throw new Error("not ready");
    expect(easy.view.rows.map((r) => r.team.short)).toEqual(["COV", "TOT", "EVE"]);
    expect(az.view.rows.map((r) => r.team.short)).toEqual(["COV", "EVE", "TOT"]);
    expect(easy.view.gameweeks).toEqual([8]);
    expect(ticker.map((r) => r.team.short)).toEqual(["EVE", "TOT", "COV"]);
  });
});

describe("loadPlayers", () => {
  it("leaves loans and transfers out of All", async () => {
    expect((await players({})).rows.map((r) => r.player)).toEqual(["Isak", "Schade", "Gakpo"]);
    expect((await players({ status: "unavailable" })).rows.map((r) => r.player)).toEqual(["Obi"]);
  });
  it("filters by club and counts within it", async () => {
    const liverpool = await players({ team: "LIV" });
    expect(liverpool.rows).toHaveLength(2);
    expect(liverpool.counts.all).toBe(2);
    expect((await players({})).counts).toEqual({ all: 3, injured: 2, doubtful: 1, suspended: 0, unavailable: 1 });
  });
  it("ignores a status or club it doesn't know", async () => {
    expect(await players({ status: "retired", team: "XXX" })).toMatchObject({ status: "all", team: null });
  });
  it("shows the down panel when the data can't be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: ToolsSource = { ...source, injuries: async () => Promise.reject(new Error("503")) };
    expect(await loadPlayers({}, down)).toEqual({ kind: "down", retry: "/players" });
  });
});

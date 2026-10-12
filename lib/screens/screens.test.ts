import { describe, expect, it } from "vitest";
import type { MyTeam } from "@/lib/league/my-team";
import type { Standings } from "@/lib/fpl/schemas";
import { rowAward, spark, SAMPLE_MARKET } from "./market";
import { pickerView } from "./picker";
import { tableView } from "./table";
import { filterInjuries, injuryCounts, sortTicker, type InjuryRow, type TickerRow } from "./tools";

const team: MyTeam = {
  id: 1234567,
  firstName: "Emeka",
  teamName: "Agbero Athletic",
  leagues: [
    { id: 1, name: "Ikeja Banter League", kind: "private", members: 12, rank: 8, lastRank: 10 },
    { id: 2, name: "Lekki Ballers", kind: "private", members: 20, rank: null, lastRank: null },
    { id: 3, name: "Overall", kind: "public", members: 11_000_000, rank: 1_204_555, lastRank: 1_391_020 },
  ],
};

describe("pickerView", () => {
  it("splits your leagues from public ones, keeping the order", () => {
    const view = pickerView(team);
    expect(view.yours.map((r) => r.name)).toEqual(["Ikeja Banter League", "Lekki Ballers"]);
    expect(view.public.map((r) => r.name)).toEqual(["Overall"]);
  });
  it("shows places moved for your leagues and only the arrow for public ones", () => {
    const view = pickerView(team);
    expect(view.yours[0]).toMatchObject({ rank: "8", move: { direction: "up", places: 2 }, showPlaces: true });
    expect(view.public[0]).toMatchObject({ rank: "1.2M", move: { direction: "up" }, showPlaces: false });
  });
  it("leaves the rank out before the first ranked gameweek", () => {
    expect(pickerView(team).yours[1].rank).toBeNull();
  });
});

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

describe("tableView", () => {
  it("shows first names only, never surnames", () => {
    const view = tableView(standings, null);
    expect(view.rows.map((r) => r.firstName)).toEqual(["Tobi", "Emeka"]);
    expect(JSON.stringify(view)).not.toContain("Adeyemi");
  });
  it("marks the remembered team and flags leagues over 50", () => {
    const view = tableView(standings, 22);
    expect(view.rows.map((r) => r.you)).toEqual([false, true]);
    expect(view.truncated).toBe(true);
    expect(view.leagueName).toBe("Denizens of Olympus");
  });
  it("treats FPL's last_rank 0 as no previous rank", () => {
    expect(tableView(standings, null).rows[1].move.direction).toBe("none");
  });
});

const tick = (short: string, run: number): TickerRow => ({ team: { id: run, name: short, short }, weeks: [], runScore: run });

describe("sortTicker", () => {
  it("puts the easiest run first, ties by name, without changing the input", () => {
    const rows = [tick("EVE", 21), tick("TOT", 16), tick("COV", 16)];
    expect(sortTicker(rows, "easy").map((r) => r.team.short)).toEqual(["COV", "TOT", "EVE"]);
    expect(sortTicker(rows, "az").map((r) => r.team.short)).toEqual(["COV", "EVE", "TOT"]);
    expect(rows.map((r) => r.team.short)).toEqual(["EVE", "TOT", "COV"]);
  });
});

const injury = (player: string, team: string, status: InjuryRow["status"]): InjuryRow => ({
  player, team, position: "MID", status, chance: null, news: "", reportedAt: "2026-10-12T09:00:00Z",
});

describe("injuries", () => {
  const rows = [injury("Isak", "LIV", "injured"), injury("Schade", "BRE", "doubtful"), injury("Obi", "MUN", "unavailable"), injury("Gakpo", "LIV", "injured")];
  it("leaves loans and transfers out of All", () => {
    expect(filterInjuries(rows, "all", null).map((r) => r.player)).toEqual(["Isak", "Schade", "Gakpo"]);
    expect(filterInjuries(rows, "unavailable", null).map((r) => r.player)).toEqual(["Obi"]);
  });
  it("filters by team and counts within it", () => {
    expect(filterInjuries(rows, "all", "LIV")).toHaveLength(2);
    expect(injuryCounts(rows, null)).toEqual({ all: 3, injured: 2, doubtful: 1, suspended: 0, unavailable: 1 });
    expect(injuryCounts(rows, "LIV").all).toBe(2);
  });
});

describe("market", () => {
  it("draws the sparkline above the zero line for a positive gap", () => {
    const s = spark([3, 10, 49]);
    expect(s.direction).toBe("up");
    const lastY = Number(s.points.split(" ").at(-1)?.split(",")[1]);
    expect(lastY).toBeLessThan(s.baseY);
  });
  it("shows one emoji per row, the first award in story order", () => {
    const bayo = SAMPLE_MARKET.rows.find((r) => r.manager.firstName === "Bayo");
    expect(bayo && rowAward(bayo)).toBe("captain");
  });
  it("ranks the sample Market by net GW score", () => {
    const nets = SAMPLE_MARKET.rows.map((r) => r.score.net);
    expect(nets).toEqual([...nets].sort((a, b) => b - a));
  });
});

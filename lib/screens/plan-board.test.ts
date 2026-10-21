import { describe, expect, it } from "vitest";
import { simulatePlan, type Rules, type Start } from "@/lib/planner/engine";
import type { PlannerPlayer } from "@/lib/planner";
import {
  addTransfer, contextFor, emptyPlan, fixtureLabel, freeLeft, nextFixtures, readPlan, rowsOf, startFromBench, transferOptions, writePlan,
  type BoardData,
} from "./plan-board";

const rules: Rules = {
  squadSize: 15, starters: 11, clubLimit: 3, budget: 1000, sellOnFee: 0.5, maxFreeTransfers: 5, transfersCap: 20, hitCost: 4,
  positions: { GK: { squad: 2, min: 1, max: 1 }, DEF: { squad: 5, min: 3, max: 5 }, MID: { squad: 5, min: 2, max: 5 }, FWD: { squad: 3, min: 1, max: 3 } },
  chips: [{ chip: "bboost", from: 1, to: 19 }],
};

let next = 1;
const player = (position: PlannerPlayer["position"], points: number[], club = next % 10 + 1, price = 50): PlannerPlayer => ({
  id: next++, name: `P${next}`, club, position, price, points, status: "a", chance: null, news: "", ownership: 1, form: 1, penalties: false, priceTrend: null,
});

// Fifteen with different clubs, plus a strong midfielder to buy and a weak bench midfielder.
const squadPlayers = [
  player("GK", [4, 4]), player("GK", [2, 2]),
  ...[5, 5, 4, 3, 1].map((p) => player("DEF", [p, p])),
  ...[6, 5, 4, 3, 1].map((p) => player("MID", [p, p])),
  ...[7, 4, 2].map((p) => player("FWD", [p, p])),
];
const star = player("MID", [9, 9], 20, 60);
const weakMid = squadPlayers[11];

const data: BoardData = {
  gws: [8, 9],
  deadline: "2026-10-23T17:30:00Z",
  rules,
  players: [...squadPlayers, star],
  clubs: [{ id: 1, name: "Arsenal", short: "ARS" }, { id: 2, name: "Everton", short: "EVE" }, { id: 3, name: "Liverpool", short: "LIV" }],
  outlook: [
    { team: 1, weeks: [{ gw: 8, matches: [{ opponent: 2, home: true, goalsFor: 1, goalsAgainst: 1, cleanSheet: 0.3 }] }, { gw: 9, matches: [] }] },
    {
      team: 2,
      weeks: [
        { gw: 8, matches: [{ opponent: 1, home: false, goalsFor: 1, goalsAgainst: 1, cleanSheet: 0.3 }, { opponent: 3, home: true, goalsFor: 1, goalsAgainst: 1, cleanSheet: 0.3 }] },
        { gw: 9, matches: [{ opponent: 3, home: false, goalsFor: 1, goalsAgainst: 1, cleanSheet: 0.3 }] },
      ],
    },
  ],
  team: null,
};
const start: Start = { gw: 8, squad: squadPlayers.map((p) => ({ id: p.id, bought: p.price })), bank: 20, freeTransfers: 1, chipsUsed: [] };
const ctx = contextFor(data);
const words = { home: "H", away: "A", blank: "No match" };

describe("fixtures", () => {
  it("writes a single, a double and a blank", () => {
    expect(fixtureLabel(data, 1, 8, words)).toBe("EVE H");
    expect(fixtureLabel(data, 2, 8, words)).toBe("ARS A / LIV H");
    expect(fixtureLabel(data, 1, 9, words)).toBe("No match");
    expect(nextFixtures(data, 2, 8, 3, words)).toBe("ARS A / LIV H · LIV A");
  });
});

describe("a week on the board", () => {
  const week = simulatePlan(start, emptyPlan(data.gws), ctx).weeks[0];
  it("puts the starters in rows, goalkeeper first", () => {
    const rows = rowsOf(week.starters, new Map(data.players.map((p) => [p.id, p])));
    expect(rows.map((r) => r.length).reduce((a, b) => a + b)).toBe(11);
    expect(rows[0]).toEqual([squadPlayers[0].id]);
  });
  it("counts the free transfers left, with no limit on a Wildcard week", () => {
    expect(freeLeft(week)).toBe(1);
    expect(freeLeft({ ...week, chip: "wildcard" })).toBeNull();
  });
  it("starts a bench player in place of the weakest starter a legal formation allows", () => {
    const benchMid = week.bench.find((id) => id === weakMid.id)!;
    const starters = startFromBench(week, benchMid, ctx)!;
    expect(starters).toContain(benchMid);
    expect(starters).toHaveLength(11);
  });
});

describe("changing the plan", () => {
  it("adds a transfer and clears later weeks' line-up choices", () => {
    const weeks = [{ gw: 8, transfers: [] }, { gw: 9, transfers: [], captain: 1, starters: [1] }];
    const changed = addTransfer(weeks, 8, { out: weakMid.id, in: star.id });
    expect(changed[0].transfers).toEqual([{ out: weakMid.id, in: star.id }]);
    expect(changed[1]).toEqual({ gw: 9, transfers: [], chip: undefined });
  });
  it("suggests waiting a week when the transfer would cost a hit now and be free then", () => {
    const first = addTransfer(emptyPlan(data.gws), 8, { out: squadPlayers[12].id, in: star.id });
    const options = transferOptions(start, first, 8, { out: weakMid.id, in: squadPlayers[12].id }, ctx);
    expect(options.later?.gw).toBe(9);
  });
});

describe("the plan kept on the phone", () => {
  const players = new Map(data.players.map((p) => [p.id, p]));
  it("round-trips the weeks that change something", () => {
    const weeks = addTransfer(emptyPlan(data.gws), 9, { out: weakMid.id, in: star.id });
    expect(readPlan(writePlan(weeks), data.gws, players)[1].transfers).toEqual([{ out: weakMid.id, in: star.id }]);
  });
  it("drops what it can't trust: bad JSON, unknown players, other gameweeks", () => {
    expect(readPlan("{not json", data.gws, players)).toEqual(emptyPlan(data.gws));
    expect(readPlan(JSON.stringify([{ gw: 8, transfers: [{ out: 9999, in: star.id }] }, { gw: 30, transfers: [] }]), data.gws, players)[0].transfers).toEqual([]);
  });
});

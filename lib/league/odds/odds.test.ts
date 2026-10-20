import { describe, expect, it } from "vitest";
import type { Bootstrap, Element, History } from "@/lib/fpl/schemas";
import { makeBundle, player, type TestManager } from "../testing";
import { buildLeagueOdds, OUT_BELOW } from "./index";
import {
  activityOf,
  CHIP_VALUE,
  GHOST_FLOOR,
  NEW_MANAGER_EDGE,
  outlookOf,
  priorEdge,
  skillEdge,
  WEEKLY_LUCK,
  type Outlook,
} from "./model";
import { seededRandom, simulateSeason, slide } from "./simulate";

const AVERAGE = 50;
const averages = new Map(Array.from({ length: 38 }, (_, i) => [i + 1, AVERAGE]));
const row = (event: number, points: number, transfers = 0, cost = 0, total = 0) => ({
  event,
  points,
  total_points: total,
  event_transfers: transfers,
  event_transfers_cost: cost,
  points_on_bench: 0,
  bank: null,
});
const history = (rows: History["current"], chips: History["chips"] = [], past: History["past"] = []): History => ({ current: rows, chips, past });
const outlook = (over: Partial<Outlook> = {}): Outlook => ({ entry: 1, total: 400, edge: 0, activity: "active", idleWeeks: 0, chipPoints: 0, ...over });
/** Normal CDF, for checking the simulation against the sum it stands in for. */
const phi = (z: number) => 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)));

describe("skill", () => {
  it("starts from last season, or below average for a new manager", () => {
    // 2333 points last season is 61.4 a week: 9.1 above the sample's 52.3, times 0.3, on top of 1.3.
    expect(priorEdge([{ season_name: "2025/26", total_points: 2333, rank: 85996 }])).toBeCloseTo(4.03, 2);
    expect(priorEdge([{ season_name: "2025/26", total_points: 1904, rank: 5832967 }, { season_name: "2023/24", total_points: 2400, rank: 9 }])).toBeCloseTo(0.6, 1);
    expect(priorEdge([])).toBe(NEW_MANAGER_EDGE);
    expect(priorEdge(null)).toBe(NEW_MANAGER_EDGE);
  });

  it("trusts this season's form a little more each week", () => {
    expect(skillEdge([], 2)).toBe(2);
    const early = skillEdge([20], 0);
    const later = skillEdge(Array(7).fill(20), 0);
    expect(early).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(early);
    // Seven weeks in, about half of a manager's margin is believed (most early form is luck).
    expect(later / 20).toBeCloseTo(16 / (16 + WEEKLY_LUCK ** 2 / 7), 6);
  });
});

describe("activity", () => {
  it("tells savers from ghosts", () => {
    expect(activityOf(2, 4)).toBe("active");
    expect(activityOf(3, 1)).toBe("quiet");
    expect(activityOf(3, 2)).toBe("ghost");
    expect(activityOf(6, 0)).toBe("ghost");
  });

  it("counts weeks since the last transfer, Wildcard or Free Hit", () => {
    const rows = [row(1, 50), row(2, 60, 1), row(3, 40), row(4, 70), row(5, 55), row(6, 45)];
    expect(outlookOf({ entry: 1, history: history(rows), gw: 6, averages, unavailableStarters: 0 }).idleWeeks).toBe(4);
    const wildcard = history(rows, [{ name: "wildcard", event: 5 }]);
    expect(outlookOf({ entry: 1, history: wildcard, gw: 6, averages, unavailableStarters: 3 }).idleWeeks).toBe(1);
    expect(outlookOf({ entry: 1, history: history(rows), gw: 6, averages, unavailableStarters: 3 }).activity).toBe("ghost");
  });
});

describe("a manager's outlook", () => {
  const rows = [row(1, 60, 0, 0, 60), row(2, 70, 2, 4, 126), row(3, 50, 0, 0, 176), row(4, 90, 1, 0, 266)];

  it("reads the total and net margins up to the gameweek only", () => {
    const at3 = outlookOf({ entry: 7, history: history(rows), gw: 3, averages, unavailableStarters: 0 });
    expect(at3.total).toBe(176);
    // Margins 10, 16 (70 − 4 − 50) and 0.
    expect(at3.edge).toBeCloseTo(skillEdge([10, 16, 0], NEW_MANAGER_EDGE), 9);
  });

  it("adds the points still to come from first-half chips, for those still playing", () => {
    const used = history(rows, [{ name: "3xc", event: 2 }]);
    const live = outlookOf({ entry: 1, history: used, gw: 4, averages, unavailableStarters: 0 });
    expect(live.chipPoints).toBeCloseTo(CHIP_VALUE.bboost + CHIP_VALUE.freehit + CHIP_VALUE.wildcard, 9);
    const ghost = outlookOf({ entry: 1, history: history(rows.slice(0, 1).concat(row(9, 50))), gw: 9, averages, unavailableStarters: 0 });
    expect(ghost.activity).toBe("ghost");
    expect(ghost.chipPoints).toBe(0);
    expect(outlookOf({ entry: 1, history: history(rows), gw: 19, averages, unavailableStarters: 0 }).chipPoints).toBe(0);
  });
});

describe("the season simulation", () => {
  it("adds up a ghost's slide week by week, down to the floor", () => {
    const byWeek = (weeks: number) => Array.from({ length: weeks }, (_, i) => Math.min(GHOST_FLOOR, i + 1)).reduce((a, b) => a + b, 0);
    for (const weeks of [0, 1, 5, 20, 31]) expect(slide(weeks)).toBe(byWeek(weeks));
  });

  it("is repeatable for the same league and gameweek", () => {
    const field = [outlook({ entry: 1, total: 410 }), outlook({ entry: 2, total: 400 }), outlook({ entry: 3, total: 395 })];
    expect(simulateSeason(field, 7, 38, "314:7", 2000)).toEqual(simulateSeason(field, 7, 38, "314:7", 2000));
    expect(seededRandom("a")()).not.toBe(seededRandom("b")());
  });

  it("hands out exactly one winner, three podium places and one last place per season", () => {
    const field = Array.from({ length: 6 }, (_, i) => outlook({ entry: i, total: 400 - i * 8 }));
    const odds = simulateSeason(field, 7, 38, "sum", 5000);
    const sum = (key: "win" | "top3" | "last") => odds.reduce((s, o) => s + o[key], 0);
    expect(sum("win")).toBeCloseTo(1, 9);
    expect(sum("top3")).toBeCloseTo(3, 9);
    expect(sum("last")).toBeCloseTo(1, 9);
  });

  it("matches the maths for two managers: a 30-point lead with 10 weeks left", () => {
    const [lead, chaser] = simulateSeason([outlook({ total: 430 }), outlook({ total: 400 })], 28, 38, "pair", 20_000);
    // Quitting hits both alike, so the lead holds with the plain normal chance, give or take.
    expect(lead.win).toBeCloseTo(phi(30 / (WEEKLY_LUCK * Math.sqrt(2 * 10))), 1);
    expect(lead.win + chaser.win).toBeCloseTo(1, 9);
  });

  it("makes a ghost likelier to finish last than an active manager level with them", () => {
    const field = [outlook({ entry: 1, total: 450 }), outlook({ entry: 2, total: 400 }), outlook({ entry: 3, total: 400, activity: "ghost" })];
    const [, active, ghost] = simulateSeason(field, 7, 38, "ghost", 10_000);
    expect(ghost.last).toBeGreaterThan(active.last + 0.2);
  });
});

describe("league odds", () => {
  const element = (id: number, status: string): Element => ({ id, status, chance_of_playing_next_round: status === "a" ? null : 0 }) as Element;
  const bootstrap = (statuses: Record<number, string> = {}): Bootstrap =>
    ({
      events: Array.from({ length: 38 }, (_, i) => ({ id: i + 1, average_entry_score: AVERAGE })),
      teams: [],
      elements: Object.entries(statuses).map(([id, s]) => element(Number(id), s)),
      game_config: null,
      chips: null,
      element_types: null,
    }) as unknown as Bootstrap;
  const weeks = (points: number[]) => points.map((p) => ({ points: p }));
  const injured = [player(90, "Hurt", 0), player(91, "Gone", 0)];
  const managers: TestManager[] = [
    { entry: 1, name: "ade bello", weeks: weeks([70, 70, 70, 70]) },
    { entry: 2, name: "bola ojo", weeks: weeks([60, 60, 60, 60]) },
    { entry: 3, name: "chi okafor", weeks: weeks([50, 50, 50, 50]), squad: injured },
    { entry: 4, name: "dayo ali", weeks: weeks([45, 45, 45, 45]) },
  ];

  it("ranks managers by their chance of winning, with this week's change", () => {
    const odds = buildLeagueOdds(makeBundle({ gw: 4, managers }), bootstrap({ 90: "i", 91: "u" }));
    expect(odds.gw).toBe(4);
    expect(odds.remaining).toBe(34);
    expect(odds.managers.slice(0, 2).map((m) => m.firstName)).toEqual(["Ade", "Bola"]);
    expect(odds.managers[0].win).toBeGreaterThan(odds.managers[1].win);
    expect(odds.managers.every((m) => m.winChange !== null)).toBe(true);
    // Chi hasn't made a transfer and has two starters out: a ghost after 3 quiet weeks.
    expect(odds.managers.find((m) => m.firstName === "Chi")).toMatchObject({ activity: "ghost", idleWeeks: 3 });
  });

  it("marks those under 1 in 1,000 to win as out", () => {
    const runaway: TestManager[] = [{ entry: 1, name: "ade", weeks: weeks(Array(30).fill(120)) }, ...managers.slice(1).map((m) => ({ ...m, weeks: weeks(Array(30).fill(40)) }))];
    const odds = buildLeagueOdds(makeBundle({ gw: 30, managers: runaway }), bootstrap());
    expect(odds.managers[0].win).toBeGreaterThan(1 - OUT_BELOW);
    expect(odds.managers.slice(1).every((m) => m.out)).toBe(true);
  });

  it("settles from the final table once the season is over, sharing ties", () => {
    const tied: TestManager[] = [
      { entry: 1, name: "ade", weeks: weeks(Array(38).fill(60)) },
      { entry: 2, name: "bola", weeks: weeks(Array(38).fill(60)) },
      { entry: 3, name: "chi", weeks: weeks(Array(38).fill(50)) },
    ];
    const odds = buildLeagueOdds(makeBundle({ gw: 38, managers: tied }), bootstrap());
    expect(odds.remaining).toBe(0);
    expect(odds.managers.map((m) => [m.firstName, m.win, m.last])).toEqual([["Ade", 0.5, 0], ["Bola", 0.5, 0], ["Chi", 0, 1]]);
  });
});

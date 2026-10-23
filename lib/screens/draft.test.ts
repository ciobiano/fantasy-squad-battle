import { describe, expect, it } from "vitest";
import type { PlannerData, PlannerPlayer } from "@/lib/planner";
import type { Position } from "@/lib/planner/engine";
import { draftChoices, draftFull, draftLines, draftMoney, draftRating, draftTeam, fullClubs, readDraft, writeDraft } from "./draft";
import { contextFor, playerMap, type BoardData } from "./plan-board";

const RULES: PlannerData["rules"] = {
  squadSize: 15, starters: 11, clubLimit: 3, budget: 1000, sellOnFee: 0.5, maxFreeTransfers: 5, transfersCap: 20, hitCost: 4,
  positions: { GK: { squad: 2, min: 1, max: 1 }, DEF: { squad: 5, min: 3, max: 5 }, MID: { squad: 5, min: 2, max: 5 }, FWD: { squad: 3, min: 1, max: 3 } },
  chips: [],
};

const player = (id: number, position: Position, club: number, price: number, points: readonly number[] = [3, 3]): PlannerPlayer => ({
  id, name: `P${id}`, club, position, price, points, status: "a", chance: null, news: "", ownership: 1, form: 3, penalties: false, priceTrend: null,
});

// Fifteen cheap players over five clubs (three each), plus a few to choose from.
const SQUAD: readonly PlannerPlayer[] = [
  player(1, "GK", 1, 45), player(2, "GK", 2, 40),
  ...[3, 4, 5, 6, 7].map((id, i) => player(id, "DEF", 1 + (i % 5), 45)),
  ...[8, 9, 10, 11, 12].map((id, i) => player(id, "MID", 1 + ((i + 2) % 5), 55, [4, 4])),
  player(13, "FWD", 3, 60, [5, 5]), player(14, "FWD", 4, 60, [5, 5]), player(15, "FWD", 5, 55),
];
const EXTRA = [player(20, "FWD", 1, 350, [8, 9]), player(21, "FWD", 2, 70, [5, 6]), player(22, "FWD", 9, 45, [2, 2])];

const data: BoardData = { gws: [8, 9], deadline: null, rules: RULES, players: [...SQUAD, ...EXTRA], clubs: [], outlook: [], team: null };
const players = playerMap(data);
const all = SQUAD.map((p) => p.id);

describe("readDraft", () => {
  it("keeps known players once each, and no more per position than a squad holds", () => {
    expect(readDraft(writeDraft([1, 2, 1, 999, 20]), players, RULES)).toEqual([1, 2, 20]);
    expect(readDraft(JSON.stringify([13, 14, 15, 20]), players, RULES)).toEqual([13, 14, 15]);
  });
  it("reads anything else as an empty draft", () => {
    expect(readDraft(null, players, RULES)).toEqual([]);
    expect(readDraft("{", players, RULES)).toEqual([]);
    expect(readDraft('{"a":1}', players, RULES)).toEqual([]);
  });
});

describe("the draft board", () => {
  it("lays out fifteen shirts by position, picks first", () => {
    const lines = draftLines([13, 1], players, RULES);
    expect(lines.map((line) => line.length)).toEqual([2, 5, 5, 3]);
    expect(lines[0]).toEqual([{ position: "GK", id: 1 }, { position: "GK", id: null }]);
    expect(lines[3][0]).toEqual({ position: "FWD", id: 13 });
  });
  it("counts the money and the shirts left", () => {
    expect(draftMoney([], players, RULES)).toEqual({ spent: 0, left: 1000, toPick: 15 });
    expect(draftMoney([1, 13], players, RULES)).toEqual({ spent: 105, left: 895, toPick: 13 });
  });
  it("names the clubs at the limit", () => {
    expect(fullClubs([1, 3, 11], players, RULES)).toEqual([1]);
    expect(fullClubs([1, 3], players, RULES)).toEqual([]);
  });
});

describe("draftChoices", () => {
  it("lists the position's players not yet picked, most projected points first", () => {
    const choices = draftChoices([13], "FWD", data, players);
    expect(choices.map((c) => c.id)).toEqual([20, 21, 14, 15, 22]);
    expect(choices[0]).toMatchObject({ points: 17, price: 350, blocked: [] });
  });
  it("keeps players the draft can't take, with the rule that stops them", () => {
    const picks = all.filter((id) => id !== 15);
    const choices = draftChoices(picks, "FWD", data, players);
    const left = draftMoney(picks, players, RULES).left;
    expect(choices.find((c) => c.id === 20)?.blocked).toEqual([{ kind: "over-budget", short: 350 - left }, { kind: "club-limit", club: 1 }]);
    expect(choices.find((c) => c.id === 22)?.blocked).toEqual([]);
  });
});

describe("a full draft", () => {
  it("is rated and becomes the plan board's team, with the change in the bank and one free transfer", () => {
    expect(draftFull(all, RULES)).toBe(true);
    expect(draftFull(all.slice(1), RULES)).toBe(false);
    expect(draftRating(all, contextFor(data))).toBeGreaterThan(0);
    const team = draftTeam(all, data, players);
    expect(team.start).toMatchObject({ gw: 8, bank: 1000 - draftMoney(all, players, RULES).spent, freeTransfers: 1, chipsUsed: [] });
    expect(team.start.squad).toContainEqual({ id: 13, bought: 60 });
  });
});

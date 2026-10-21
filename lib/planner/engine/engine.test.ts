import { describe, expect, it } from "vitest";
import { RULES_2026_27 } from "../rules";
import { chipValues } from "./chips";
import { bestLineup } from "./lineup";
import { rankSquads, rateSquad } from "./rating";
import { replacementsFor } from "./replacements";
import { chipAvailable, chipsLeft, formationAllowed, sellingPrice, squadValue } from "./rules";
import { type Context, simulatePlan } from "./simulate";
import { suggestPairs, suggestTransfers } from "./suggest";
import type { EnginePlayer, Position, Start } from "./types";

// Hand-made squads, so each rule's effect can be read straight off the numbers.
// Two gameweeks (8 and 9); points are per gameweek.

const rules = RULES_2026_27;
const p = (id: number, position: Position, club: number, price: number, points: [number, number]): EnginePlayer => ({ id, position, club, price, points });

// A legal 15: 2 GK, 5 DEF, 5 MID, 3 FWD, no more than 3 per club.
const SQUAD: EnginePlayer[] = [
  p(1, "GK", 1, 50, [4, 4]),
  p(2, "GK", 2, 40, [1, 1]),
  p(3, "DEF", 3, 55, [5, 5]),
  p(4, "DEF", 4, 50, [4, 4]),
  p(5, "DEF", 5, 45, [3, 3]),
  p(6, "DEF", 6, 45, [2, 2]),
  p(7, "DEF", 7, 40, [1, 1]),
  p(8, "MID", 8, 100, [7, 7]),
  p(9, "MID", 9, 80, [6, 6]),
  p(10, "MID", 10, 70, [5, 5]),
  p(11, "MID", 11, 60, [3, 3]),
  p(12, "MID", 12, 45, [1, 1]),
  p(13, "FWD", 13, 140, [8, 9]),
  p(14, "FWD", 14, 75, [5, 5]),
  p(15, "FWD", 15, 45, [2, 2]),
];
// Players to buy.
const MARKET: EnginePlayer[] = [
  p(20, "FWD", 16, 80, [9, 9]),
  p(21, "MID", 1, 60, [6, 6]),
  p(22, "DEF", 1, 45, [6, 6]),
  p(23, "DEF", 1, 45, [5, 5]),
  p(24, "MID", 13, 200, [20, 20]),
  p(25, "GK", 3, 45, [6, 6]),
];
const players = new Map([...SQUAD, ...MARKET].map((x) => [x.id, x]));
const ctx: Context = { players, gws: [8, 9], rules };
const start: Start = { gw: 8, squad: SQUAD.map((x) => ({ id: x.id, bought: x.price })), bank: 50, freeTransfers: 1, chipsUsed: [] };
const ids = SQUAD.map((x) => x.id);

describe("selling price", () => {
  it("keeps half a rise, rounded down, and passes on a fall in full", () => {
    expect(sellingPrice(50, 53, 0.5)).toBe(51);
    expect(sellingPrice(50, 54, 0.5)).toBe(52);
    expect(sellingPrice(50, 47, 0.5)).toBe(47);
    expect(sellingPrice(50, 50, 0.5)).toBe(50);
  });

  it("values a squad at what it would sell for, plus the bank", () => {
    const risen = { ...start, squad: [{ id: 1, bought: 46 }] };
    expect(squadValue(risen.squad, 5, players, rules)).toBe(5 + 48);
  });
});

describe("best line-up", () => {
  it("fills the best formation FPL allows, keeper first on the bench", () => {
    const lineup = bestLineup(ids, players, (id) => players.get(id)!.points[0], rules)!;
    expect(lineup.starters).toHaveLength(11);
    expect(formationAllowed(lineup.starters, new Set(ids), players, rules)).toBe(true);
    // 1 GK, 3 DEF (5, 4, 3), 4 MID (7, 6, 5, 3), 3 FWD (8, 5, 2) = 4+12+21+15 = 52 beats any other shape.
    expect(lineup.starters.reduce((s, id) => s + players.get(id)!.points[0], 0)).toBe(52);
    expect(lineup.bench[0]).toBe(2);
    expect([lineup.captain, lineup.vice]).toEqual([13, 8]);
  });

  it("refuses an eleven outside FPL's limits", () => {
    const twoKeepers = [1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 14];
    expect(formationAllowed(twoKeepers, new Set(ids), players, rules)).toBe(false);
    expect(formationAllowed([1, 3, 4, 5, 8, 9, 10, 11, 13, 14], new Set(ids), players, rules)).toBe(false);
  });

  it("is null when no formation can be filled", () => {
    expect(bestLineup([3, 4, 5, 8], players, () => 1, rules)).toBeNull();
  });
});

describe("chips", () => {
  it("gives one of each per half", () => {
    expect(chipAvailable("wildcard", 8, [], rules)).toBe(true);
    expect(chipAvailable("wildcard", 8, [{ chip: "wildcard", gw: 6 }], rules)).toBe(false);
    expect(chipAvailable("wildcard", 20, [{ chip: "wildcard", gw: 6 }], rules)).toBe(true);
    expect(chipAvailable("wildcard", 1, [], rules)).toBe(false);
    expect(chipsLeft(8, [{ chip: "3xc", gw: 3 }], rules).filter((c) => c.chip === "3xc")).toEqual([{ chip: "3xc", from: 20, to: 38 }]);
  });
});

describe("simulatePlan", () => {
  it("plays the best eleven with no plan, and saves the free transfer", () => {
    const result = simulatePlan(start, [], ctx);
    expect(result.weeks.map((w) => w.gw)).toEqual([8]);
    expect(result.weeks[0].points).toBe(52 + 8);
    const two = simulatePlan(start, [{ gw: 9, transfers: [] }], ctx);
    expect(two.weeks.map((w) => w.freeTransfers)).toEqual([1, 2]);
  });

  it("charges a hit for each transfer beyond the free ones", () => {
    const result = simulatePlan(start, [{ gw: 8, transfers: [{ out: 15, in: 20 }, { out: 7, in: 22 }] }], ctx);
    const week = result.weeks[0];
    expect(week.hits).toBe(1);
    expect(week.issues).toEqual([]);
    expect(week.bank).toBe(50 + 45 - 80 + 40 - 45);
    // FWD 20 (9) replaces 15 (2) and becomes captain; DEF 22 (6) starts. Minus 4 for the hit.
    expect(week.captain).toBe(20);
    expect(week.points).toBe(4 + (6 + 5 + 4) + (7 + 6 + 5 + 3) + (9 + 8 + 5) + 9 - 4);
  });

  it("saves free transfers up to the limit, and spends them before charging", () => {
    const many = { ...start, freeTransfers: 5 };
    const result = simulatePlan(many, [{ gw: 8, transfers: [] }, { gw: 9, transfers: [] }], ctx);
    expect(result.weeks.map((w) => w.freeTransfers)).toEqual([5, 5]);
    const spend = simulatePlan({ ...start, freeTransfers: 2 }, [{ gw: 8, transfers: [{ out: 15, in: 20 }, { out: 7, in: 22 }] }, { gw: 9, transfers: [] }], ctx);
    expect(spend.weeks.map((w) => [w.hits, w.freeTransfers])).toEqual([[0, 2], [0, 1]]);
  });

  it("makes Wildcard transfers free and keeps the saved ones", () => {
    const result = simulatePlan(
      { ...start, freeTransfers: 3 },
      [{ gw: 8, chip: "wildcard", transfers: [{ out: 15, in: 20 }, { out: 7, in: 22 }, { out: 12, in: 21 }] }, { gw: 9, transfers: [] }],
      ctx,
    );
    expect(result.weeks[0].hits).toBe(0);
    expect(result.weeks[1].freeTransfers).toBe(3);
    expect(result.weeks[1].squad.map((o) => o.id)).toContain(20);
  });

  it("brings the old squad back after a Free Hit", () => {
    const result = simulatePlan(start, [{ gw: 8, chip: "freehit", transfers: [{ out: 15, in: 20 }] }, { gw: 9, transfers: [] }], ctx);
    expect(result.weeks[0].squad.map((o) => o.id)).toContain(20);
    expect(result.weeks[1].squad.map((o) => o.id)).toEqual(ids);
    expect(result.weeks[1].bank).toBe(start.bank);
  });

  it("counts the bench on Bench Boost and the captain three times on Triple Captain", () => {
    const boost = simulatePlan(start, [{ gw: 8, chip: "bboost", transfers: [] }], ctx).weeks[0];
    expect(boost.points).toBe(60 + (1 + 2 + 1 + 1));
    const triple = simulatePlan(start, [{ gw: 8, chip: "3xc", transfers: [] }], ctx).weeks[0];
    expect(triple.points).toBe(60 + 8);
  });

  it("refuses a chip already played this half", () => {
    const result = simulatePlan({ ...start, chipsUsed: [{ chip: "bboost", gw: 2 }] }, [{ gw: 8, chip: "bboost", transfers: [] }], ctx);
    expect(result.weeks[0].issues).toEqual([{ kind: "chip-unavailable", chip: "bboost" }]);
    expect(result.weeks[0].chip).toBeNull();
    expect(result.valid).toBe(false);
  });

  it("leaves out transfers that break the rules, and says why", () => {
    const result = simulatePlan(
      start,
      [
        {
          gw: 8,
          transfers: [
            { out: 99, in: 20 },
            { out: 15, in: 21 },
            { out: 13, in: 13 },
            { out: 12, in: 21 },
            { out: 7, in: 22 },
            { out: 6, in: 23 },
          ],
        },
      ],
      ctx,
    );
    const week = result.weeks[0];
    expect(week.issues).toEqual([
      { kind: "not-owned", player: 99 },
      { kind: "position-mismatch", out: 15, in: 21 },
      { kind: "already-owned", player: 13 },
      { kind: "club-limit", club: 1 },
    ]);
    expect(week.transfers).toEqual([{ out: 12, in: 21 }, { out: 7, in: 22 }]);
  });

  it("flags a squad over budget", () => {
    const poor = { ...start, bank: 0 };
    const week = simulatePlan(poor, [{ gw: 8, transfers: [{ out: 14, in: 20 }] }], ctx).weeks[0];
    expect(week.issues).toEqual([{ kind: "over-budget", short: 5 }]);
  });

  it("takes the manager's eleven and captain when legal, and says when not", () => {
    const starters = [1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14];
    const week = simulatePlan(start, [{ gw: 8, transfers: [], starters, captain: 8 }], ctx).weeks[0];
    expect(week.starters).toEqual(starters);
    expect(week.captain).toBe(8);
    const bad = simulatePlan(start, [{ gw: 8, transfers: [], captain: 2 }], ctx).weeks[0];
    expect(bad.issues).toEqual([{ kind: "captain-not-starting" }]);
    expect(bad.captain).toBe(13);
  });
});

describe("team rating", () => {
  it("adds the best eleven and captain each week, split by position", () => {
    const rating = rateSquad(ids, ctx);
    expect(rating.perWeek).toEqual([60, 62]);
    expect(rating.points).toBe(122);
    expect(rating.captaincy).toBe(17);
    expect(rating.byPosition).toEqual({ GK: 8, DEF: 24, MID: 42, FWD: 31 });
    expect(rating.players.find((x) => x.id === 2)).toEqual({ id: 2, points: 2, starts: 0 });
  });

  it("ranks squads, sharing a rank on equal ratings", () => {
    const better = ids.map((id) => (id === 15 ? 20 : id));
    const ranked = rankSquads([{ squad: ids, name: "a" }, { squad: better, name: "b" }, { squad: ids, name: "c" }], ctx);
    expect(ranked.map((r) => [r.name, r.rank])).toEqual([["b", 1], ["a", 2], ["c", 2]]);
  });
});

describe("transfer ideas", () => {
  it("finds the swaps that lift the rating most, within budget and the club limit", () => {
    const ideas = suggestTransfers(start, ctx);
    // 20 replaces 15 up front: +8 in GW8 (he captains), +7 in GW9 (13 keeps the armband on price).
    expect(ideas[0]).toEqual({ transfers: [{ out: 15, in: 20 }], gain: 15, bank: 15 });
    expect(ideas.every((i) => i.gain > 0 && i.bank >= 0)).toBe(true);
    expect(ideas.some((i) => i.transfers[0].in === 24)).toBe(false);
    for (const idea of ideas) expect(simulatePlan(start, [{ gw: 8, transfers: idea.transfers }], ctx).valid).toBe(true);
  });

  it("charges a hit when no free transfer is left", () => {
    const [best] = suggestTransfers({ ...start, freeTransfers: 0 }, ctx);
    expect(best.gain).toBe(15 - rules.hitCost);
  });

  it("combines the best singles into pairs", () => {
    const [pair] = suggestPairs(start, ctx);
    expect(pair.transfers).toHaveLength(2);
    // 20 up front, and 22 for a bench defender (6 and 7 tie on points; either way +3 a week).
    expect(pair.transfers[0]).toEqual({ out: 15, in: 20 });
    expect(pair.transfers[1].in).toBe(22);
    expect(pair.gain).toBe(15 + 6 - rules.hitCost);
  });
});

describe("replacements for one player", () => {
  it("ranks every player in the position by what he adds to the team", () => {
    const list = replacementsFor(start, 15, ctx);
    expect(list.map((r) => r.id)).toEqual([20]);
    // 20 starts up front and captains in GW8: +8 then +7, as the transfer ideas found.
    expect(list[0]).toEqual({ id: 20, gain: 15, price: 80, blocked: [] });
  });

  it("matches a full rating of the new squad, bench players included", () => {
    const base = rateSquad(ids, ctx).points;
    for (const out of [7, 12, 2]) {
      for (const r of replacementsFor(start, out, ctx)) {
        expect(r.gain).toBeCloseTo(rateSquad(ids.map((id) => (id === out ? r.id : id)), ctx).points - base, 9);
      }
    }
    // A keeper who never starts adds nothing; 25 beats the starter, so he adds his margin twice.
    expect(replacementsFor(start, 2, ctx)).toEqual([{ id: 25, gain: 4, price: 45, blocked: [] }]);
  });

  it("keeps players the squad can't take, with every rule that blocks them", () => {
    const poor = { squad: start.squad, bank: 0 };
    const mids = replacementsFor(poor, 12, ctx);
    // 24 costs 200 against 45 for 12: 155 short, and a 2nd from club 13 is still allowed.
    expect(mids.find((r) => r.id === 24)).toMatchObject({ blocked: [{ kind: "over-budget", short: 155 }] });
    const crowded = { squad: start.squad.map((o) => (o.id === 6 ? { id: 22, bought: 45 } : o.id === 5 ? { id: 23, bought: 45 } : o)), bank: 50 };
    // Club 1 now has the keeper, 22 and 23: a 4th (21) breaks the limit.
    expect(replacementsFor(crowded, 12, ctx).find((r) => r.id === 21)).toMatchObject({ blocked: [{ kind: "club-limit", club: 1 }] });
  });

  it("counts only the weeks from the transfer on", () => {
    expect(replacementsFor(start, 15, ctx, 9)[0].gain).toBe(7);
  });

  it("is empty for a player not in the squad", () => {
    expect(replacementsFor(start, 99, ctx)).toEqual([]);
  });
});

describe("chip values for one gameweek", () => {
  it("prices Bench Boost at the bench's points and Triple Captain at the captain's", () => {
    expect(chipValues(ids, 8, ctx)).toEqual({ benchBoost: 1 + 2 + 1 + 1, tripleCaptain: { captain: 13, extra: 8 } });
    expect(chipValues(ids, 9, ctx).tripleCaptain).toEqual({ captain: 13, extra: 9 });
    expect(chipValues([3, 4], 8, ctx)).toEqual({ benchBoost: 0, tripleCaptain: null });
  });
});

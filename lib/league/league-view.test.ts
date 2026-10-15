import { describe, expect, it } from "vitest";
import { buildLeagueView } from "./league-view";
import { competitionRanks, firstNameOf } from "./standings";
import { makeBundle, player } from "./testing";
import type { AwardId, LeagueView } from "./types";

const awardOf = (view: LeagueView, id: AwardId) => view.awards.find((a) => a.id === id);
const winnerNames = (view: LeagueView, id: AwardId) => awardOf(view, id)?.winners.map((w) => w.manager.firstName);

describe("names and ranks", () => {
  it.each([
    ["valentine chukwu", "Valentine"],
    ["Kelechi O", "Kelechi"],
    ["WiLL Shakespeare", "WiLL"],
    ["  ada  ", "Ada"],
    // Seen in a real league (1261677, GW6): capitals, initials, and a name with no letters.
    ["AMATEZE OKAFOR", "Amateze"],
    ["JB Okonkwo", "JB"],
    ["TJB Adeyemi", "TJB"],
    ["ÉMILE DUPONT", "Émile"],
  ])("first name of %j is %s", (input, expected) => {
    expect(firstNameOf(input)).toBe(expected);
  });

  it("uses the team name, never a surname, when the first name has no letters", () => {
    expect(firstNameOf("9 9", "nineAgain")).toBe("nineAgain");
    expect(firstNameOf("9 Okafor", "nineAgain")).toBe("nineAgain");
  });

  it("shares ranks on equal values (1, 2, 2, 4)", () => {
    expect(competitionRanks([10, 8, 8, 5], (v) => v)).toEqual([1, 2, 2, 4]);
    expect(competitionRanks([5, 8, 10, 8], (v) => v)).toEqual([4, 2, 1, 2]);
  });
});

describe("Oga of the Week and Wooden Spoon", () => {
  const view = buildLeagueView(
    makeBundle({
      gw: 1,
      managers: [
        { entry: 1, name: "ade one", weeks: [{ points: 71, hits: 4 }] },
        { entry: 2, name: "bola two", weeks: [{ points: 67 }] },
        { entry: 3, name: "chidi three", weeks: [{ points: 40 }] },
      ],
    }),
  );

  it("ranks by score net of hits, and tied managers share the award", () => {
    expect(awardOf(view, "oga")?.stat).toBe(67);
    expect(winnerNames(view, "oga")).toEqual(["Ade", "Bola"]);
    expect(awardOf(view, "oga")?.winners[0].score).toEqual({ net: 67, points: 71, hits: 4 });
  });

  it("gives the lowest net score the Wooden Spoon", () => {
    expect(awardOf(view, "spoon")).toMatchObject({ stat: 40 });
    expect(winnerNames(view, "spoon")).toEqual(["Chidi"]);
  });

  it("skips the Wooden Spoon when everyone scored the same", () => {
    const same = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: [{ points: 50 }] },
          { entry: 2, name: "bola", weeks: [{ points: 50 }] },
        ],
      }),
    );
    expect(awardOf(same, "spoon")).toBeUndefined();
    expect(same.skipped).toContain("spoon");
  });
});

describe("Captain Disaster (D4, D6)", () => {
  const week = [{ points: 50 }];

  it("goes to the lowest captain score of 2 or fewer, naming the captain", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: week, captain: player(10, "Haaland", 1) },
          { entry: 2, name: "bola", weeks: week, captain: player(11, "Salah", 8) },
        ],
      }),
    );
    expect(awardOf(view, "captain")).toMatchObject({ stat: 1 });
    expect(awardOf(view, "captain")?.winners[0].captain).toMatchObject({ name: "Haaland", points: 1 });
  });

  it("counts a captain who didn't play, even when the vice-captain stepped in", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: week, captain: player(12, "Isak", 0, 0), vice: player(13, "Wood", 6) },
          { entry: 2, name: "bola", weeks: week, captain: player(11, "Salah", 8) },
        ],
      }),
    );
    expect(awardOf(view, "captain")?.winners[0].captain).toEqual({
      name: "Isak",
      points: 0,
      minutes: 0,
      tripleCaptain: false,
      viceRescued: true,
      // The vice who came in counted, so he's the best of the rest.
      best: { name: "Wood", points: 6 },
    });
  });

  it("counts a Triple Captain pick like any other captain", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: week, captain: player(14, "Saka", 2), chip: "3xc" },
          { entry: 2, name: "bola", weeks: week, captain: player(11, "Salah", 8) },
        ],
      }),
    );
    expect(awardOf(view, "captain")?.winners[0].captain).toMatchObject({ name: "Saka", tripleCaptain: true });
  });

  it("sets the captain against the best other player who counted, not the bench", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          {
            entry: 1,
            name: "ade",
            weeks: week,
            captain: player(10, "Haaland", 1),
            squad: [player(40, "Saka", 9), player(41, "Rice", 9), player(42, "Gabriel", 2)],
            bench: [player(43, "Raya", 15)],
          },
          { entry: 2, name: "bola", weeks: week, captain: player(11, "Salah", 8) },
        ],
      }),
    );
    // Saka and Rice tie on 9: the earlier pick wins. Raya's 15 sat on the bench.
    expect(awardOf(view, "captain")?.winners[0].captain?.best).toEqual({ name: "Saka", points: 9 });
  });

  it("is skipped when every captain scored 3 or more", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: week, captain: player(15, "Palmer", 3) },
          { entry: 2, name: "bola", weeks: week, captain: player(11, "Salah", 8) },
        ],
      }),
    );
    expect(view.skipped).toContain("captain");
  });
});

describe("Bench Regret and Hit Merchant (D6)", () => {
  it("go to the most bench points and the biggest hit", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: [{ points: 60, bench: 12, hits: 8 }] },
          { entry: 2, name: "bola", weeks: [{ points: 60, bench: 5, hits: 4 }] },
        ],
      }),
    );
    expect(awardOf(view, "bench")).toMatchObject({ stat: 12 });
    expect(winnerNames(view, "bench")).toEqual(["Ade"]);
    expect(awardOf(view, "hits")).toMatchObject({ stat: 8 });
    expect(awardOf(view, "hits")?.winners[0].score).toEqual({ net: 52, points: 60, hits: 8 });
  });

  it("are skipped when nobody left points on the bench or took a hit (as FPL reports on chip weeks)", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: [{ points: 60, bench: 0, hits: 0 }] },
          { entry: 2, name: "bola", weeks: [{ points: 50, bench: 0, hits: 0 }] },
        ],
      }),
    );
    expect(view.skipped).toEqual(expect.arrayContaining(["bench", "hits"]));
  });

  it("names who sat on the bench, in bench order", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          {
            entry: 1,
            name: "ade",
            weeks: [{ points: 60, bench: 14 }],
            bench: [player(50, "Verbruggen", 6), player(51, "Cherki", 8), player(52, "Calafiori", 0, 0)],
          },
          { entry: 2, name: "bola", weeks: [{ points: 60, bench: 2 }] },
        ],
      }),
    );
    expect(awardOf(view, "bench")?.winners[0].bench).toEqual([
      { name: "Verbruggen", points: 6 },
      { name: "Cherki", points: 8 },
      { name: "Calafiori", points: 0 },
    ]);
  });
});

describe("Biggest Climber and Biggest Faller (D5)", () => {
  // GW1 totals: Chidi 70, Bola 60, Ade 50 (Dayo not playing yet).
  // GW2 totals: Dayo 100, Ade 90, Chidi 80, Bola 65.
  const view = buildLeagueView(
    makeBundle({
      gw: 2,
      managers: [
        { entry: 1, name: "ade", weeks: [{ points: 50 }, { points: 40 }] },
        { entry: 2, name: "bola", weeks: [{ points: 60 }, { points: 5 }] },
        { entry: 3, name: "chidi", weeks: [{ points: 70 }, { points: 10 }] },
        { entry: 4, name: "dayo", weeks: [null, { points: 100 }] },
      ],
    }),
  );

  it("works out league ranks from season totals at each gameweek", () => {
    expect(view.table.map((r) => [r.manager.firstName, r.rank, r.lastRank])).toEqual([
      ["Dayo", 1, null],
      ["Ade", 2, 3],
      ["Chidi", 3, 1],
      ["Bola", 4, 2],
    ]);
  });

  it("gives Climber to the biggest rise and Faller to the biggest drop, sharing ties", () => {
    expect(awardOf(view, "climber")).toMatchObject({ stat: 1 });
    expect(awardOf(view, "climber")?.winners[0]).toMatchObject({ ranks: { from: 3, to: 2 } });
    expect(awardOf(view, "faller")).toMatchObject({ stat: 2 });
    expect(winnerNames(view, "faller")).toEqual(["Bola", "Chidi"]);
  });

  it("skips anyone with no previous gameweek", () => {
    expect(winnerNames(view, "climber")).not.toContain("Dayo");
  });
});

describe("Middle Class (D3)", () => {
  const steady = (entry: number, name: string, points: number) => ({
    entry,
    name,
    weeks: [{ points }, { points }, { points }],
  });

  it("is the middle third of the table whose rank stayed within 1 place over 3 gameweeks", () => {
    const view = buildLeagueView(
      makeBundle({
        gw: 3,
        managers: [
          steady(1, "ade", 90),
          steady(2, "bola", 80),
          steady(3, "chidi", 70),
          steady(4, "dayo", 60),
          steady(5, "emeka", 50),
          steady(6, "funmi", 40),
        ],
      }),
    );
    expect(awardOf(view, "middle")).toMatchObject({ stat: 2 });
    expect(winnerNames(view, "middle")).toEqual(["Chidi", "Dayo"]);
  });

  it("leaves out a middle-table manager who moved 2 places", () => {
    // Ranks by GW (1, 2, 3): Chidi 5 → 3 → 3 (moved 2), Dayo 3 → 3 → 4 (moved 1).
    const view = buildLeagueView(
      makeBundle({
        gw: 3,
        managers: [
          { entry: 1, name: "ade", weeks: [{ points: 100 }, { points: 10 }, { points: 10 }] },
          { entry: 2, name: "bola", weeks: [{ points: 95 }, { points: 10 }, { points: 10 }] },
          { entry: 3, name: "chidi", weeks: [{ points: 60 }, { points: 30 }, { points: 20 }] },
          { entry: 4, name: "dayo", weeks: [{ points: 85 }, { points: 5 }, { points: 5 }] },
          { entry: 5, name: "emeka", weeks: [{ points: 80 }, { points: 5 }, { points: 5 }] },
          { entry: 6, name: "funmi", weeks: [{ points: 50 }, { points: 5 }, { points: 5 }] },
        ],
      }),
    );
    expect(winnerNames(view, "middle")).toEqual(["Dayo"]);
  });

  it("needs 3 gameweeks", () => {
    const view = buildLeagueView(
      makeBundle({ gw: 2, managers: [1, 2, 3, 4, 5, 6].map((n) => ({ entry: n, name: `m${n}`, weeks: [{ points: n }, { points: n }] })) }),
    );
    expect(view.skipped).toContain("middle");
  });
});

describe("Market and Table views", () => {
  const view = buildLeagueView(
    makeBundle({
      gw: 2,
      status: "provisional",
      managers: [
        { entry: 1, name: "ade", weeks: [{ points: 50 }, { points: 60 }] },
        { entry: 2, name: "bola", weeks: [{ points: 70 }, { points: 30 }] },
        { entry: 3, name: "chidi", weeks: [{ points: 60 }, { points: 60 }] },
        { entry: 4, name: "dayo", weeks: [null, null] },
      ],
    }),
    { youId: 2 },
  );

  it("sorts the Market by this gameweek's score, with non-players last", () => {
    expect(view.market.map((r) => [r.manager.firstName, r.gwRank])).toEqual([
      ["Ade", 1],
      ["Chidi", 1],
      ["Bola", 3],
      ["Dayo", null],
    ]);
  });

  it("gives each manager a gap to the league average that sums to zero each gameweek", () => {
    for (let gw = 0; gw < 2; gw++) {
      const gaps = view.market.flatMap((r) => (r.gapSeries[gw] === null ? [] : [r.gapSeries[gw]!]));
      expect(gaps.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 5);
    }
    expect(view.market.find((r) => r.manager.firstName === "Dayo")?.gapSeries).toEqual([null, null]);
  });

  it("gives each manager their league rank after every gameweek", () => {
    const series = Object.fromEntries(view.market.map((r) => [r.manager.firstName, r.rankSeries]));
    expect(series).toEqual({ Ade: [3, 2], Bola: [1, 3], Chidi: [2, 1], Dayo: [null, null] });
    // The last point is the table's rank.
    for (const row of view.table) expect(series[row.manager.firstName].at(-1)).toBe(row.rank);
  });

  it("marks the visitor's own team and tags award winners", () => {
    expect(view.market.find((r) => r.manager.isYou)?.manager.firstName).toBe("Bola");
    expect(view.market.find((r) => r.manager.firstName === "Bola")?.awards).toContain("spoon");
  });

  it("carries the provisional flag and both averages", () => {
    expect(view.gameweek).toEqual({ id: 2, status: "provisional", provisional: true });
    expect(view.averages).toEqual({ league: 50, fpl: 50 });
  });

  it("lists the table by league rank with movement", () => {
    // GW1 totals: Bola 70, Chidi 60, Ade 50. GW2 totals: Chidi 120, Ade 110, Bola 100.
    expect(view.table.map((r) => [r.manager.firstName, r.rank, r.movement, r.total])).toEqual([
      ["Chidi", 1, 1, 120],
      ["Ade", 2, 1, 110],
      ["Bola", 3, -2, 100],
      ["Dayo", null, null, null],
    ]);
  });
});

describe("Team of the Week", () => {
  it("shows the dream team with how many league managers own each player", () => {
    const gross = { ...player(20, "Groß", 15), position: 3 as const };
    const haaland = { ...player(21, "Haaland", 13), position: 4 as const };
    const view = buildLeagueView(
      makeBundle({
        gw: 1,
        managers: [
          { entry: 1, name: "ade", weeks: [{ points: 50 }], squad: [gross] },
          { entry: 2, name: "bola", weeks: [{ points: 40 }], squad: [gross, haaland] },
        ],
        dreamTeam: { team: [gross, haaland], top: gross },
      }),
    );
    expect(view.teamOfTheWeek.players).toEqual([
      { id: 20, name: "Groß", club: "TST", position: "MID", points: 15, ownedBy: 2 },
      { id: 21, name: "Haaland", club: "TST", position: "FWD", points: 13, ownedBy: 1 },
    ]);
    expect(view.teamOfTheWeek.topPlayer).toEqual({ name: "Groß", points: 15 });
  });
});

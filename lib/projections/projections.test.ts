import { describe, expect, it, vi } from "vitest";
import { bootstrapSchema, fixturesSchema, type Bootstrap, type Fixture } from "@/lib/fpl/schemas";
import rawBootstrap from "@/lib/planner/__fixtures__/bootstrap.json";
import rawFixtures from "@/lib/planner/__fixtures__/fixtures.json";
import { availability, RECOVERY, returnDate } from "./availability";
import { buildProjections } from "./index";
import { atLeast, expectedPer, poisson } from "./poisson";
import { SCORING_2026_27, scoringOf } from "./scoring";
import { AWAY_EDGE, FALLBACK_GOALS, HOME_EDGE, expectedGoals, matchesPlayed, teamStrengths } from "./teams";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// Real FPL data from 19 Oct 2026 (GW7 current, GW8 next): every fixture, and
// every player who has played or is flagged.
const bootstrap = bootstrapSchema.parse(rawBootstrap);
const fixtures = fixturesSchema.parse(rawFixtures);
const projections = buildProjections(bootstrap, fixtures);
const byName = (name: string) => bootstrap.elements.find((e) => e.web_name === name)!;
const projected = (name: string) => projections.players.find((p) => p.id === byName(name).id)!;
const DAY = 86_400_000;

describe("Poisson helpers", () => {
  it("add up, and count points per n events", () => {
    const total = Array.from({ length: 30 }, (_, k) => poisson(k, 2.5)).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 9);
    expect(atLeast(0, 3)).toBe(1);
    expect(atLeast(1, 1.2)).toBeCloseTo(1 - Math.exp(-1.2), 9);
    // floor(X/2) for X ~ Poisson(1): P(2)+P(3) + 2(P(4)+P(5)) + …
    expect(expectedPer(2, 1)).toBeCloseTo(0.2838, 3);
    expect(expectedPer(3, 0)).toBe(0);
  });
});

describe("club strength", () => {
  it("counts completed matches, and leans on the average early on", () => {
    expect(Math.max(...matchesPlayed(fixtures).values())).toBe(7);
    const preseason: Bootstrap = { ...bootstrap, elements: bootstrap.elements.map((e) => ({ ...e, expected_goals: 0, expected_goals_conceded: 0 })) };
    const fresh = teamStrengths(preseason, fixtures.map((f) => ({ ...f, started: false, finished: false, finished_provisional: false })));
    expect(fresh.average).toBe(FALLBACK_GOALS);
    expect(new Set([...fresh.teams.values()].map((t) => t.attack.toFixed(6)))).toEqual(new Set([FALLBACK_GOALS.toFixed(6)]));
  });

  it("rates attack by xG created and defence by xG faced", () => {
    const { teams } = teamStrengths(bootstrap, fixtures);
    const club = (short: string) => teams.get(bootstrap.teams.find((t) => t.short_name === short)!.id)!;
    // Arsenal have faced the least xG in the league so far.
    expect(club("ARS").defence).toBe(Math.min(...[...teams.values()].map((t) => t.defence)));
    expect(club("MCI").attack).toBeGreaterThan(club("HUL").attack);
  });

  it("gives the home side its edge", () => {
    const { teams, average } = teamStrengths(bootstrap, fixtures);
    const [a, b] = [...teams.values()];
    expect(expectedGoals(a, b, true, average) / expectedGoals(a, b, false, average)).toBeCloseTo(HOME_EDGE / AWAY_EDGE, 9);
  });
});

describe("availability", () => {
  const deadlines = [8, 9, 10, 11].map((gw) => Date.parse(`2026-10-${16 + gw}T17:30:00Z`));

  it("reads FPL's return date, in the right year", () => {
    expect(returnDate("Hamstring injury - Expected back 1 Nov", "2026-10-02T15:00:00Z")).toBe(Date.UTC(2026, 10, 1));
    expect(returnDate("Suspended until 31 Oct", "2026-10-17T16:30:00Z")).toBe(Date.UTC(2026, 9, 31));
    expect(returnDate("Knee injury - Expected back 10 Jan", "2026-12-20T10:00:00Z")).toBe(Date.UTC(2027, 0, 10));
    expect(returnDate("Knee injury - Unknown return date", "2026-10-02T15:00:00Z")).toBeNull();
  });

  it("follows FPL's chance next week, then the return date or a gradual recovery", () => {
    const flags = (status: string, chance: number | null, news = "") => ({ status, chance_of_playing_next_round: chance, news, news_added: "2026-10-15T10:00:00Z" });
    expect(availability(flags("a", null), deadlines)).toEqual([1, 1, 1, 1]);
    expect(availability(flags("d", 75), deadlines)).toEqual([0.75, 1, 1, 1]);
    expect(availability(flags("u", 0, "Has joined Stoke City permanently"), deadlines)).toEqual([0, 0, 0, 0]);
    expect(availability(flags("i", 0, "Knee injury - Unknown return date"), deadlines)).toEqual([0, ...RECOVERY, 1]);
    // Back on 26 Oct: misses GW8 (deadline 24 Oct), plays from GW9 (25 Oct deadline, matches the next day).
    expect(availability(flags("i", 0, "Ankle injury - Expected back 26 Oct"), deadlines)).toEqual([0, 1, 1, 1]);
    // Deadlines a day earlier: back on 27 Oct only counts from the 26 Oct deadline (matches on the 27th).
    expect(availability(flags("s", 0, "Suspended until 27 Oct"), deadlines.map((d) => d - DAY))).toEqual([0, 0, 0, 1]);
  });
});

describe("player projections", () => {
  it("projects every player over the six gameweeks from the next deadline", () => {
    expect(projections.gws).toEqual([8, 9, 10, 11, 12, 13]);
    expect(projections.players.every((p) => p.points.length === 6 && p.points.every((n) => Number.isFinite(n)))).toBe(true);
    expect(projections.teams).toHaveLength(20);
  });

  it("ranks the season's standout forward top, in a sane range", () => {
    const forwards = projections.players.filter((p) => bootstrap.elements.find((e) => e.id === p.id)!.element_type === 4);
    const best = [...forwards].sort((a, b) => b.total - a.total)[0];
    expect(best.id).toBe(byName("Haaland").id);
    expect(best.points[0]).toBeGreaterThan(5);
    expect(best.points[0]).toBeLessThan(9);
  });

  it("adds up to about what a gameweek really scores", () => {
    // Real: 918 points per gameweek so far this season, injured players included.
    const nextWeek = projections.players.reduce((sum, p) => sum + p.points[0], 0);
    expect(nextWeek).toBeGreaterThan(700);
    expect(nextWeek).toBeLessThan(950);
  });

  it("scores nothing for a player ruled out, and nothing in a blank week", () => {
    expect(projected("Janelt").points[0]).toBe(0);
    const ars = bootstrap.teams.find((t) => t.short_name === "ARS")!.id;
    const blank: Fixture[] = fixtures.map((f) => (f.event === 8 && (f.team_h === ars || f.team_a === ars) ? { ...f, event: null } : f));
    const without = buildProjections(bootstrap, blank).players.find((p) => p.id === byName("Saka").id)!;
    expect(without.points[0]).toBe(0);
    expect(without.points[1]).toBe(projected("Saka").points[1]);
  });

  it("follows FPL's points table, with today's as a stand-in", () => {
    expect(scoringOf(bootstrap)).toEqual(SCORING_2026_27);
    const noTable: Bootstrap = { ...bootstrap, game_config: null };
    expect(scoringOf(noTable)).toBe(SCORING_2026_27);
    const goalsWorthMore: Bootstrap = {
      ...bootstrap,
      game_config: { ...bootstrap.game_config!, scoring: { ...SCORING_2026_27, goals_scored: { ...SCORING_2026_27.goals_scored, FWD: 8 } } },
    };
    const haaland = (b: Bootstrap) => buildProjections(b, fixtures).players.find((p) => p.id === byName("Haaland").id)!.total;
    expect(haaland(goalsWorthMore)).toBeGreaterThan(haaland(bootstrap) + 10);
  });
});

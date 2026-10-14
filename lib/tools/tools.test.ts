import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapSchema, fixturesSchema, type Bootstrap, type Fixture } from "@/lib/fpl/schemas";
import rawBootstrap from "./__fixtures__/bootstrap-tools.json";
import rawFixtures from "./__fixtures__/fixtures-season.json";
import { buildInjuryReport, getInjuryReport } from "./injuries";
import { BLANK_COST, buildTicker, getTicker, tickerGameweeks, weekCost } from "./ticker";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// Real FPL data from 13 Oct 2026 (GW6 current, GW7 next): every fixture, and
// every flagged player plus five available ones.
const bootstrap = bootstrapSchema.parse(rawBootstrap);
const fixtures = fixturesSchema.parse(rawFixtures);
const NOW = Date.parse("2026-10-13T12:25:00Z");

const withNext = (gw: number): Bootstrap => ({
  ...bootstrap,
  events: bootstrap.events.map((e) => ({ ...e, is_next: e.id === gw })),
});

/** Moves one fixture to another gameweek: a blank for both teams, and a double where it lands. */
const moved = (fixture: Fixture, gw: number | null) => fixtures.map((f) => (f.id === fixture.id ? { ...f, event: gw } : f));

describe("fixture ticker", () => {
  const ticker = buildTicker(bootstrap, fixtures);
  const row = (short: string) => ticker.find((r) => r.team.short === short)!;

  it("shows every team over the next six gameweeks", () => {
    expect(ticker).toHaveLength(20);
    expect(ticker[0].weeks.map((w) => w.gw)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(ticker.every((r) => r.weeks.every((w) => w.matches.length === 1))).toBe(true);
  });

  it("reads each side's own difficulty, home and away", () => {
    const f = fixtures.find((x) => x.event === 7)!;
    const [home, away] = [ticker.find((r) => r.team.id === f.team_h)!, ticker.find((r) => r.team.id === f.team_a)!];
    expect(home.weeks[0].matches[0]).toEqual({ opponent: away.team.short, home: true, difficulty: f.team_h_difficulty });
    expect(away.weeks[0].matches[0]).toEqual({ opponent: home.team.short, home: false, difficulty: f.team_a_difficulty });
  });

  it("sums the run, so lower is easier", () => {
    const ars = row("ARS");
    expect(ars.runScore).toBe(ars.weeks.reduce((sum, w) => sum + w.matches[0].difficulty, 0));
  });

  it("shows blank and double weeks, and scores them", () => {
    const f = fixtures.find((x) => x.event === 8)!;
    const changed = buildTicker(bootstrap, moved(f, 9));
    const home = changed.find((r) => r.team.id === f.team_h)!;
    expect(home.weeks[1].matches).toEqual([]);
    expect(home.weeks[2].matches).toHaveLength(2);
    expect(home.runScore).not.toBe(ticker.find((r) => r.team.id === f.team_h)!.runScore);
  });

  it("costs a blank more than any match, and a double less than its easier match", () => {
    const m = (difficulty: 1 | 2 | 3 | 4 | 5) => ({ opponent: "X", home: true, difficulty });
    expect(weekCost([])).toBe(BLANK_COST);
    expect(weekCost([m(5)])).toBe(5);
    expect(weekCost([m(4), m(2)])).toBe(1);
    expect(weekCost([m(1), m(3)])).toBe(0);
  });

  it("shortens at the end of the season and empties once it's over", () => {
    expect(tickerGameweeks(withNext(36).events, 6)).toEqual([36, 37, 38]);
    expect(tickerGameweeks(withNext(0).events, 6)).toEqual([]);
    expect(buildTicker(withNext(0), fixtures).every((r) => r.weeks.length === 0)).toBe(true);
  });

  it("skips unscheduled fixtures", () => {
    const f = fixtures.find((x) => x.event === 7)!;
    const home = buildTicker(bootstrap, moved(f, null)).find((r) => r.team.id === f.team_h)!;
    expect(home.weeks[0].matches).toEqual([]);
  });

  it("refuses to guess a difficulty FPL didn't send", () => {
    const broken = fixtures.map((f) => (f.event === 7 ? { ...f, team_h_difficulty: null } : f));
    expect(() => buildTicker(bootstrap, broken)).toThrow(/difficulty/);
  });
});

describe("injuries & bans", () => {
  const report = buildInjuryReport(bootstrap, NOW);
  const count = (status: string) => report.rows.filter((r) => r.status === status).length;

  it("lists every flagged player and nobody available", () => {
    expect(report.rows).toHaveLength(197);
    expect([count("injured"), count("doubtful"), count("suspended"), count("unavailable")]).toEqual([67, 21, 4, 105]);
  });

  it("puts the newest news first", () => {
    const times = report.rows.map((r) => Date.parse(r.reportedAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("gives every doubtful player a chance of playing", () => {
    const doubtful = report.rows.filter((r) => r.status === "doubtful");
    expect(doubtful.every((r) => r.chance === 25 || r.chance === 50 || r.chance === 75)).toBe(true);
  });

  it("lists every club for the filter, and when the news was read", () => {
    expect(report.clubs).toHaveLength(20);
    expect(report.clubs).toEqual([...report.clubs].sort());
    expect(report.asOf).toBe(NOW);
  });

  it("reads odd values safely", () => {
    const base = bootstrap.elements[0];
    const odd = buildInjuryReport(
      {
        ...bootstrap,
        elements: [
          { ...base, id: 9001, web_name: "NotEligible", status: "n", chance_of_playing_next_round: 33, news: null, news_added: null },
          { ...base, id: 9002, web_name: "Unknown", status: "x" },
          { ...base, id: 9003, web_name: "Manager", status: "i", element_type: 5 },
        ],
      },
      NOW,
    );
    expect(odd.rows).toEqual([
      expect.objectContaining({ player: "NotEligible", status: "unavailable", chance: null, news: "", reportedAt: "" }),
    ]);
  });
});

describe("live loaders", () => {
  beforeEach(() => {
    vi.stubEnv("FPL_RELAY_URL", "");
    vi.stubEnv("FPL_RELAY_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) => {
        const path = new URL(String(input)).pathname;
        const body = path === "/api/bootstrap-static/" ? rawBootstrap : path === "/api/fixtures/" ? rawFixtures : null;
        return new Response(JSON.stringify(body ?? { detail: "Not found." }), { status: body ? 200 : 404 });
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("build the ticker and the report from FPL", async () => {
    expect(await getTicker(3)).toEqual(buildTicker(bootstrap, fixtures, 3));
    expect(await getInjuryReport(NOW)).toEqual(buildInjuryReport(bootstrap, NOW));
  });
});
